
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, XCircle, Download, UserPlus } from 'lucide-react';
import { unifiedBatchVerifyEmails } from '@/lib/actions/lead-search/unified';
import { EmailVerifyBadge } from './EmailVerifyBadge';
import { LeadContact } from '@/lib/services/lead-search/types';
import { toast } from 'sonner';

interface BatchVerifyPanelProps {
    onAddContacts?: (contacts: LeadContact[]) => void;
}

interface VerifyResultItem {
    email: string;
    status: string;
    score: number;
    provider: string;
    error?: string;
}

export function BatchVerifyPanel({ onAddContacts }: BatchVerifyPanelProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<VerifyResultItem[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

    useEffect(() => {
        console.log('BatchVerifyPanel Mounted');
    }, []);

    const handleVerify = async () => {
        const emails = input
            .split('\n')
            .map(e => e.trim())
            .filter(e => e && e.includes('@')); // Basic validation

        if (emails.length === 0) return;

        setIsLoading(true);
        setResults([]);
        setSelectedEmails(new Set()); // Reset selection
        setProgress(0);

        try {
            // Using the server action which handles batching
            // We could improve UI feedback by doing client-side chunking if we wanted real-time progress updates
            // For now, let's just await the whole thing
            const response = await unifiedBatchVerifyEmails(emails); // This returns UnifiedSearchResult[]

            const formattedResults = response.map((r, index) => ({
                email: emails[index],
                status: r.data?.status?.status || 'unknown',
                score: r.data?.status?.score || 0,
                provider: r.provider,
                error: r.error
            }));

            // Auto-select valid emails
            const validEmails = new Set<string>();
            formattedResults.forEach(r => {
                if (r.status === 'valid') {
                    validEmails.add(r.email);
                }
            });
            setSelectedEmails(validEmails);

            setResults(formattedResults);

        } catch (error) {
            console.error(error);
            toast.error('批量验证失败', { description: '请稍后重试' });
        } finally {
            setIsLoading(false);
            setProgress(100);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const all = new Set(results.map(r => r.email));
            setSelectedEmails(all);
        } else {
            setSelectedEmails(new Set());
        }
    };

    const handleSelectOne = (email: string, checked: boolean) => {
        const newSet = new Set(selectedEmails);
        if (checked) {
            newSet.add(email);
        } else {
            newSet.delete(email);
        }
        setSelectedEmails(newSet);
    };

    const handleImportContacts = () => {
        if (!onAddContacts || selectedEmails.size === 0) return;

        const contactsToImport: LeadContact[] = results
            .filter(r => selectedEmails.has(r.email))
            .map(r => ({
                email: r.email,
                firstName: '',
                lastName: '',
                source: 'hunter', // Or make this dynamic based on r.provider
                emailVerified: r.status === 'valid',
                emailVerificationStatus: r.status as any,
                confidence: r.score
            }));

        onAddContacts(contactsToImport);
        toast.success(`已导入 ${contactsToImport.length} 个联系人`);
    };

    const handleExportCSV = () => {
        if (results.length === 0) return;

        const headers = ['Email', 'Status', 'Score', 'Provider', 'Error'];
        const csvContent = [
            headers.join(','),
            ...results.map(r => [
                r.email,
                r.status,
                r.score,
                r.provider,
                r.error || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `email_verification_results_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-sm font-medium">批量验证邮箱</h3>
                <p className="text-xs text-muted-foreground">每行输入一个邮箱地址 (由于API限制，建议一次不超过10个)</p>
                <Textarea
                    placeholder="john@example.com&#10;jane@test.com"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                />
            </div>

            <div className="flex items-center gap-2">
                <Button onClick={handleVerify} disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    开始验证 ({input.split('\n').filter(Boolean).length})
                </Button>
            </div>

            {results.length > 0 && (
                <div className="border rounded-md">
                    <div className="p-2 border-b bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                            <span>已选择 {selectedEmails.size} / {results.length}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleExportCSV}>
                                <Download className="h-4 w-4 mr-1" />
                                导出 CSV
                            </Button>
                            <Button size="sm" onClick={handleImportContacts} disabled={selectedEmails.size === 0}>
                                <UserPlus className="h-4 w-4 mr-1" />
                                导入联系人
                            </Button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={selectedEmails.size === results.length && results.length > 0}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Provider</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedEmails.has(item.email)}
                                            onCheckedChange={(checked) => handleSelectOne(item.email, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{item.email}</TableCell>
                                    <TableCell>
                                        <EmailVerifyBadge status={item.status} score={item.score} />
                                    </TableCell>
                                    <TableCell>{item.score}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground capitalize">{item.provider}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
