'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Search,
    Globe,
    User,
    Mail,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    ExternalLink,
    Linkedin,
    Phone,
    Building2,
    Plus,
} from 'lucide-react';
import { searchDomain, findEmail, verifyEmail } from '@/lib/actions/lead-search/hunter';
import { LeadContact } from '@/lib/services/lead-search';
import { cn } from '@/lib/utils';

interface LeadSearchPanelProps {
    onAddContact?: (contact: LeadContact) => void;
    onAddContacts?: (contacts: LeadContact[]) => void;
}

export function LeadSearchPanel({ onAddContact, onAddContacts }: LeadSearchPanelProps) {
    const [activeTab, setActiveTab] = useState('domain');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<LeadContact[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 域名搜索表单状态
    const [domain, setDomain] = useState('');

    // 姓名搜索表单状态
    const [searchDomainName, setSearchDomainName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // 邮箱验证表单状态
    const [emailToVerify, setEmailToVerify] = useState('');
    const [verifyResult, setVerifyResult] = useState<{
        isValid: boolean;
        status: string;
    } | null>(null);

    // 域名搜索
    const handleDomainSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain.trim()) return;

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const result = await searchDomain({ domain: domain.trim(), limit: 20 });

            if (result.success && result.contacts) {
                setResults(result.contacts);
                if (result.contacts.length === 0) {
                    setError('未找到任何邮箱地址');
                }
            } else {
                setError(result.error || '搜索失败');
            }
        } catch (err) {
            setError('搜索过程中发生错误');
        } finally {
            setIsLoading(false);
        }
    };

    // 姓名搜索
    const handleNameSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchDomainName.trim() || (!firstName.trim() && !lastName.trim())) return;

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const result = await findEmail({
                domain: searchDomainName.trim(),
                firstName: firstName.trim() || undefined,
                lastName: lastName.trim() || undefined,
            });

            if (result.success && result.contact) {
                setResults([result.contact]);
            } else {
                setError(result.error || '未找到匹配的邮箱');
            }
        } catch (err) {
            setError('搜索过程中发生错误');
        } finally {
            setIsLoading(false);
        }
    };

    // 邮箱验证
    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailToVerify.trim()) return;

        setIsLoading(true);
        setError(null);
        setVerifyResult(null);

        try {
            const result = await verifyEmail(emailToVerify.trim());

            if (result.success && result.data) {
                setVerifyResult({
                    isValid: result.isValid || false,
                    status: result.data.status,
                });
            } else {
                setError(result.error || '验证失败');
            }
        } catch (err) {
            setError('验证过程中发生错误');
        } finally {
            setIsLoading(false);
        }
    };

    // 添加单个联系人
    const handleAddContact = (contact: LeadContact) => {
        onAddContact?.(contact);
    };

    // 添加所有联系人
    const handleAddAllContacts = () => {
        onAddContacts?.(results);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    线索搜索
                </CardTitle>
                <CardDescription>
                    使用 Hunter.io 搜索潜在客户的邮箱地址
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="domain" className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            域名搜索
                        </TabsTrigger>
                        <TabsTrigger value="name" className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            姓名搜索
                        </TabsTrigger>
                        <TabsTrigger value="verify" className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            邮箱验证
                        </TabsTrigger>
                    </TabsList>

                    {/* 域名搜索 */}
                    <TabsContent value="domain" className="space-y-4">
                        <form onSubmit={handleDomainSearch} className="flex gap-2">
                            <Input
                                placeholder="输入域名，例如: example.com"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading || !domain.trim()}>
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* 姓名搜索 */}
                    <TabsContent value="name" className="space-y-4">
                        <form onSubmit={handleNameSearch} className="space-y-3">
                            <Input
                                placeholder="公司域名，例如: example.com"
                                value={searchDomainName}
                                onChange={(e) => setSearchDomainName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="名"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="姓"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading || !searchDomainName.trim() || (!firstName.trim() && !lastName.trim())}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Search className="h-4 w-4 mr-2" />
                                )}
                                查找邮箱
                            </Button>
                        </form>
                    </TabsContent>

                    {/* 邮箱验证 */}
                    <TabsContent value="verify" className="space-y-4">
                        <form onSubmit={handleVerifyEmail} className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="输入邮箱地址进行验证"
                                value={emailToVerify}
                                onChange={(e) => setEmailToVerify(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading || !emailToVerify.trim()}>
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    '验证'
                                )}
                            </Button>
                        </form>

                        {verifyResult && (
                            <div className={cn(
                                'p-4 rounded-lg flex items-center gap-3',
                                verifyResult.isValid
                                    ? 'bg-green-500/10 text-green-600'
                                    : 'bg-red-500/10 text-red-600'
                            )}>
                                {verifyResult.isValid ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <XCircle className="h-5 w-5" />
                                )}
                                <div>
                                    <p className="font-medium">
                                        {verifyResult.isValid ? '邮箱有效' : '邮箱无效'}
                                    </p>
                                    <p className="text-sm opacity-80">
                                        状态: {verifyResult.status}
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* 错误提示 */}
                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {/* 搜索结果 */}
                {results.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                找到 {results.length} 个联系人
                            </p>
                            {onAddContacts && (
                                <Button size="sm" variant="outline" onClick={handleAddAllContacts}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    全部导入
                                </Button>
                            )}
                        </div>
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                                {results.map((contact, index) => (
                                    <LeadContactCard
                                        key={`${contact.email}-${index}`}
                                        contact={contact}
                                        onAdd={onAddContact ? () => handleAddContact(contact) : undefined}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// 联系人卡片组件
function LeadContactCard({
    contact,
    onAdd
}: {
    contact: LeadContact;
    onAdd?: () => void;
}) {
    return (
        <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                            {contact.fullName || contact.email}
                        </p>
                        {contact.emailVerified !== undefined && (
                            <EmailVerifyBadge verified={contact.emailVerified} />
                        )}
                    </div>

                    {contact.position && (
                        <p className="text-sm text-muted-foreground truncate">
                            {contact.position}
                        </p>
                    )}

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {contact.email && (
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                            </span>
                        )}
                        {contact.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phone}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        {contact.company?.name && (
                            <Badge variant="secondary" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {contact.company.name}
                            </Badge>
                        )}
                        {contact.linkedin && (
                            <a
                                href={contact.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600"
                            >
                                <Linkedin className="h-4 w-4" />
                            </a>
                        )}
                        {contact.confidence !== undefined && (
                            <Badge variant="outline" className="text-xs">
                                置信度 {contact.confidence}%
                            </Badge>
                        )}
                    </div>
                </div>

                {onAdd && (
                    <Button size="sm" variant="ghost" onClick={onAdd}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

// 邮箱验证状态徽章
function EmailVerifyBadge({ verified }: { verified: boolean }) {
    if (verified) {
        return (
            <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                已验证
            </Badge>
        );
    }

    return (
        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            未验证
        </Badge>
    );
}

export default LeadSearchPanel;
