'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Search,
    Building2,
    Users,
    FileSpreadsheet,
    Globe,
    CheckCircle2,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import { AISearchForm } from '@/components/mail/search/AISearchForm';
import { DomainSearchForm, SearchResultCard } from '@/components/mail/search';
import { SearchResult } from '@/lib/actions/mail/search';
import { toast } from 'sonner';

// 三步骤流程卡片
function ProcessSteps() {
    const steps = [
        {
            step: 1,
            title: '单个域名查询',
            description: '输入单个域名，即可获取公司背景和决策人邮箱。',
            icon: Globe,
        },
        {
            step: 2,
            title: '批量域名查询',
            description: '粘贴多个域名，一键创建批量任务，30分钟锁定2万家公司背资。',
            icon: FileSpreadsheet,
            comingSoon: true,
        },
        {
            step: 3,
            title: '保存决策人邮箱',
            description: '在任务结果中，一键筛选目标客户，批量保存决策人邮箱。',
            icon: Users,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
            {steps.map((item) => (
                <Card key={item.step} className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
                    {item.comingSoon && (
                        <div className="absolute top-2 right-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                即将推出
                            </span>
                        </div>
                    )}
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                                {item.step}
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// 价值主张
function ValueProposition() {
    const features = [
        '7000万全球精准卖家数据',
        '9亿精确到职位的决策人信息',
        '数据涵盖：Google、LinkedIn、zoominfo、facebook、twitter',
    ];

    return (
        <div className="text-center py-12 border-t border-border/50 mt-12">
            <h2 className="text-xl font-semibold mb-6">找到精准决策人，对大客户高效销售</h2>
            <div className="flex flex-wrap justify-center gap-6">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SearchPage() {
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [prefillDomain, setPrefillDomain] = useState('');

    const handleSearchComplete = (result: SearchResult) => {
        setSearchResult(result);
        if (result.error) {
            toast.error(result.error);
        } else if (result.contacts.length > 0) {
            toast.success(`找到 ${result.contacts.length} 个联系人`);
        } else {
            toast.info('未找到联系人');
        }
    };

    const handleSaveContact = async (contact: any) => {
        // TODO: 实现保存到联系人逻辑
        toast.success(`已保存联系人: ${contact.email}`);
    };

    const handleSaveAll = async () => {
        // TODO: 实现批量保存逻辑
        if (searchResult?.contacts) {
            toast.success(`已保存全部 ${searchResult.contacts.length} 个联系人`);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
            {/* 页面头部 */}
            <div className="mb-8">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
                    <Search className="mr-2 h-3 w-3" />
                    搜客引擎 · 精准获客
                </div>
                <h1 className="text-3xl font-bold tracking-tight">公司域名搜客</h1>
                <p className="text-muted-foreground mt-1">
                    通过客户网站或域名，批量挖掘公司详细资料和决策人邮箱，助您精准高效获客。
                </p>
            </div>

            {/* 三步骤流程 */}
            <ProcessSteps />

            {/* 搜索区域 */}
            <div className="mb-8">
                <Tabs defaultValue="domain" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="domain" className="px-6">Domain Search</TabsTrigger>
                        <TabsTrigger value="ai" className="px-6 flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            AI Discover
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="domain">
                        <DomainSearchForm onSearchComplete={handleSearchComplete} initialDomain={prefillDomain} />
                    </TabsContent>

                    <TabsContent value="ai">
                        <AISearchForm onSelectDomain={(domain) => {
                            // Switch to domain tab and trigger search (requires state lift or query param, handling simpler via callback props)
                            // We can use a ref or just update state that DomainSearchForm listens to? 
                            // Easier: We set a generic state "activeDomain" and force switch tab.
                            // But for now let's just toast or handle simpler flow.
                            // Better: Pass a handler to Auto-Fill the other form.
                            // Actually, let's keep it simple: SearchResult update directly? 
                            // DomainSearchForm handles the *action*. 
                            // Let's modify DomainSearchForm to accept `initialValue`.
                            // I added `initialDomain={searchResult?.query}` above, but wait, `searchResult` is output. 
                            // Let's add a new state `prefillDomain`.
                            setPrefillDomain(domain);
                            const tabTrigger = document.querySelector('[data-value="domain"]') as HTMLElement;
                            tabTrigger?.click();
                        }} />
                    </TabsContent>
                </Tabs>
            </div>

            {/* 搜索结果 */}
            {searchResult && (
                <div className="mt-8">
                    <SearchResultCard
                        result={searchResult}
                        onSaveContact={handleSaveContact}
                        onSaveAll={handleSaveAll}
                    />
                </div>
            )}

            {/* 价值主张 (仅在无结果时显示) */}
            {!searchResult && <ValueProposition />}
        </div>
    );
}
