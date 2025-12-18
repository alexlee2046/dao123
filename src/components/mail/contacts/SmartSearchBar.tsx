
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, History, Loader2, Building2, User, Mail, Info, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { unifiedSearchDomain, unifiedFindEmail, getRecentSearches, unifiedGetAccountInfo } from '@/lib/actions/lead-search/unified';
import { LeadContact, SearchHistory } from '@/lib/services/lead-search/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SmartSearchBarProps {
    onResults: (contacts: LeadContact[]) => void;
    onError: (error: string) => void;
    isSearching: boolean;
    setIsSearching: (val: boolean) => void;
}

type SearchIntent = 'domain' | 'email_finder' | 'email_verify' | 'unknown';

export function SmartSearchBar({ onResults, onError, isSearching, setIsSearching }: SmartSearchBarProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState('');
    const [history, setHistory] = React.useState<SearchHistory[]>([]);
    const [intent, setIntent] = React.useState<SearchIntent>('unknown');
    const [quota, setQuota] = React.useState<{ searches: { used: number, available: number }, verifications: { used: number, available: number } } | null>(null);

    // Fetch history and quota on mount
    const fetchHistory = React.useCallback(async () => {
        const data = await getRecentSearches(5);
        setHistory(data as any);
    }, []);

    const fetchQuota = React.useCallback(async () => {
        try {
            const res = await unifiedGetAccountInfo();
            if (res.success && res.data) {
                setQuota({
                    searches: res.data.requests.searches,
                    verifications: res.data.requests.verifications
                });
            }
        } catch (e) {
            console.error('Failed to fetch quota', e);
        }
    }, []);

    React.useEffect(() => {
        fetchHistory();
        fetchQuota();
    }, [fetchHistory, fetchQuota]);

    // Detect intent
    React.useEffect(() => {
        const v = value.trim();
        if (!v) {
            setIntent('unknown');
            return;
        }

        // 1. Email Verification
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            setIntent('email_verify');
            return;
        }

        // 2. Email Finder (Natural Language)
        // Matches: "Name at Company", "Name @ Company", "Name from Company"
        // Also: "Role at Company" (logic handled in handleSearch)
        if (/\s+(at|@|from)\s+/i.test(v)) {
            setIntent('email_finder');
            return;
        }

        // 3. Domain Search (Simple)
        if (v.includes('.') && !v.includes(' ')) {
            setIntent('domain');
            return;
        }

        // 4. Fallback: If 2+ words, assume email finder (Name Domain)
        if (v.split(' ').length >= 2) {
            setIntent('email_finder');
            return;
        }

        setIntent('unknown');
    }, [value]);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        setIsSearching(true);
        setOpen(false);
        onError('');

        try {
            // NLP preprocessing
            let processedQuery = query;
            let intentOverride = intent;

            // Handle "Name at Company" -> "Name Company" logic
            if (intent === 'email_finder' || /\s+(at|@|from)\s+/i.test(query)) {
                const parts = query.split(/\s+(?:at|@|from)\s+/i);
                if (parts.length >= 2) {
                    const namePart = parts[0].trim();
                    const domainPart = parts[1].trim();

                    // If domainPart doesn't have a dot, it might be a company name "Stripe"
                    // We might need an enriched search, but for now let's hope it's a domain or we treat it as one
                    // Actually, let's keep it simple: pass to findEmail

                    const result = await unifiedFindEmail({
                        fullName: namePart,
                        domain: domainPart.includes('.') ? domainPart : `${domainPart}.com` // Naive fallback
                    });

                    if (result.success && result.data?.contact) {
                        onResults([result.data.contact]);
                        // Refresh quota after search
                        fetchQuota();
                    } else {
                        onError(result.error || '未找到该邮箱，请尝试提供完整域名');
                    }
                    setIsSearching(false);
                    fetchHistory();
                    return; // Done
                }
            }

            // Normal Execution based on Intent
            if (intent === 'domain' || (query.includes('.') && !query.includes(' '))) {
                // Domain Search
                const result = await unifiedSearchDomain({
                    domain: query.replace('https://', '').replace('http://', '').replace('/', ''),
                    limit: 10
                });
                if (result.success && result.data?.contacts) {
                    onResults(result.data.contacts);
                    if (result.data.contacts.length === 0) onError('未找到相关联系人');
                    fetchQuota();
                } else {
                    onError(result.error || '搜索失败');
                }
            }
            else if (intent === 'email_finder' || query.includes(' ')) {
                // Name + Domain standard handling
                // Try to find the domain part (word with dot)
                const parts = query.split(' ');
                const domainIndex = parts.findIndex(p => p.includes('.'));
                if (domainIndex !== -1) {
                    const domainPart = parts[domainIndex].trim();
                    const namePart = parts.filter((_, i) => i !== domainIndex).join(' ').trim();

                    const result = await unifiedFindEmail({
                        fullName: namePart,
                        domain: domainPart
                    });
                    if (result.success && result.data?.contact) {
                        onResults([result.data.contact]);
                        fetchQuota();
                    } else {
                        onError(result.error || '未找到该邮箱');
                    }
                } else {
                    onError('请使用 "姓名 @ 域名" 或 "姓名 at 公司名" 格式');
                }
            }
            else if (intent === 'email_verify') {
                onError('请使用下方的 "邮箱验证" 标签页进行验证');
            }
            else {
                onError('无法识别搜索请求，请输入 域名 (stripe.com) 或 姓名+域名');
            }

            // Refresh history
            fetchHistory();

        } catch (err) {
            console.error(err);
            onError('发生未知错误');
        } finally {
            setIsSearching(false);
        }
    };

    const handleHistoryClick = (item: any) => {
        // Re-construct query from history item
        if (item.query && typeof item.query === 'object') {
            const q = item.query;
            if (item.search_type === 'domain' && q.domain) {
                setValue(q.domain);
                handleSearch(q.domain);
            } else if (item.search_type === 'email' && q.domain && q.fullName) {
                const queryText = `${q.fullName} @ ${q.domain}`;
                setValue(queryText);
                handleSearch(queryText);
            }
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-6">
            <div className="relative border rounded-lg shadow-sm bg-background hover:shadow-md transition-shadow group">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                    className="w-full px-10 py-2.5 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                    placeholder="输入域名 (stripe.com), 或找人 (John at Stripe)..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch(value);
                    }}
                    onFocus={() => {
                        setOpen(true);
                    }}
                // onBlur={() => setTimeout(() => setOpen(false), 200)}
                />

                {/* Right Side Icons: Loader or Quota */}
                <div className="absolute right-3 top-2.5 flex items-center gap-2">
                    {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                        quota && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help bg-muted/50 px-2 py-0.5 rounded-full">
                                            <Zap className="h-3 w-3 text-yellow-500" />
                                            <span>{quota.searches.available - quota.searches.used}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Search Quota: {quota.searches.used} / {quota.searches.available}</p>
                                        <p>Verify Quota: {quota.verifications.used} / {quota.verifications.available}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    )}
                </div>
            </div>

            {/* Suggestions / History Popover */}
            {open && !isSearching && (
                <div className="absolute top-full left-0 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md z-50 p-1 animate-in fade-in slide-in-from-top-1">
                    {history.length > 0 && (
                        <>
                            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5 flex items-center">
                                <History className="h-3 w-3 mr-1" />
                                最近搜索
                            </div>
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    onClick={() => {
                                        handleHistoryClick(item);
                                        setOpen(false);
                                    }}
                                >
                                    {(item as any).search_type === 'domain' ? <Building2 className="h-4 w-4 text-orange-500" /> : <User className="h-4 w-4 text-blue-500" />}
                                    <span className="flex-1 truncate">
                                        {(item as any).query?.domain || 'Unknown Search'}
                                        {(item as any).query?.fullName ? ` - ${(item as any).query.fullName}` : ''}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                            {history.length > 0 && <div className="h-px bg-border my-1" />}
                        </>
                    )}

                    {/* Search Tips / Empty State */}
                    {value.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                            <div className="font-medium text-xs mb-2">尝试搜索:</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer" onClick={() => setValue('stripe.com')}>
                                    <Building2 className="h-3 w-3" /> stripe.com
                                </div>
                                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer" onClick={() => setValue('Patrick at Stripe')}>
                                    <User className="h-3 w-3" /> Patrick at Stripe
                                </div>
                                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer" onClick={() => setValue('openai.com')}>
                                    <Building2 className="h-3 w-3" /> openai.com
                                </div>
                                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer" onClick={() => setValue('Sam Altman @ openai.com')}>
                                    <User className="h-3 w-3" /> Sam Altman...
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Close overlay */}
                    <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)}></div>
                </div>
            )}

            {/* Intent Indicator */}
            {value && (
                <div className="absolute -bottom-6 left-1 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-1">
                    {intent === 'domain' && <span className="text-orange-600 flex items-center"><Building2 className="h-3 w-3 mr-1" /> 搜索公司域名</span>}
                    {intent === 'email_finder' && <span className="text-blue-600 flex items-center"><User className="h-3 w-3 mr-1" /> 查找联系人邮箱</span>}
                    {intent === 'email_verify' && <span className="text-green-600 flex items-center"><Mail className="h-3 w-3 mr-1" /> 验证邮箱 (请切换标签页)</span>}
                </div>
            )}
        </div>
    );
}
