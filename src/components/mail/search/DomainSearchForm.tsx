'use client';

import { useState, useTransition, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Globe } from 'lucide-react';
import { searchDomainAction, SearchResult } from '@/lib/actions/mail/search';

interface DomainSearchFormProps {
    onSearchComplete: (result: SearchResult) => void;
    initialDomain?: string;
}

export function DomainSearchForm({ onSearchComplete, initialDomain }: DomainSearchFormProps) {
    const [domain, setDomain] = useState(initialDomain || '');
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (initialDomain) setDomain(initialDomain);
    }, [initialDomain]);

    const handleSearch = () => {
        if (!domain.trim()) return;

        startTransition(async () => {
            const result = await searchDomainAction(domain);
            onSearchComplete(result);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isPending) {
            handleSearch();
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-2 bg-card border border-border rounded-xl shadow-sm">
                <div className="flex items-center gap-2 pl-3 text-muted-foreground">
                    <Globe className="h-5 w-5" />
                </div>
                <Input
                    type="text"
                    placeholder='输入域名或公司名称，如 "walmart.com"'
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isPending}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                />
                <Button
                    onClick={handleSearch}
                    disabled={isPending || !domain.trim()}
                    className="px-6"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            搜索中...
                        </>
                    ) : (
                        <>
                            <Search className="mr-2 h-4 w-4" />
                            查找邮箱
                        </>
                    )}
                </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-3">
                输入你要搜索的客户网站或公司名称，比如 "<span className="text-primary">walmart.com</span>" 即可查找邮箱。
            </p>
        </div>
    );
}
