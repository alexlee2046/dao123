'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Search,
    Plus,
    Upload,
    Download,
    Users,
    RefreshCw,
    Loader2,
    Globe,
} from 'lucide-react';
import { ContactsTable } from './ContactsTable';
import { AddContactDialog } from './AddContactDialog';
import { ImportDialog } from './ImportDialog';
import { LeadSearchPanel } from './LeadSearchPanel';
import { getContacts, Contact, createContact } from '@/lib/actions/mail/contacts';
import { LeadContact } from '@/lib/services/lead-search';
import { toast } from 'sonner';

export function ContactsPageClient() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [showLeadSearch, setShowLeadSearch] = useState(false);

    const loadContacts = useCallback(async () => {
        setIsLoading(true);
        const result = await getContacts({ search: search || undefined });
        setContacts(result.contacts);
        setTotal(result.total);
        setIsLoading(false);
    }, [search]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadContacts();
    };

    // 添加从线索搜索导入的联系人
    const handleAddLeadContact = async (lead: LeadContact) => {
        try {
            await createContact({
                email: lead.email || '',
                first_name: lead.firstName || null,
                last_name: lead.lastName || null,
                company_name: lead.company?.name,
                position: lead.position || null,
                phone: lead.phone || null,
                source: lead.source || 'hunter',
                email_verified: lead.emailVerified,
                email_verification_status: lead.emailVerificationStatus,
                email_source: lead.source,
                confidence_score: lead.confidence,
            });
            toast.success('联系人已添加');
            loadContacts();
        } catch (error) {
            toast.error('添加失败');
        }
    };

    // 批量添加联系人
    const handleAddLeadContacts = async (leads: LeadContact[]) => {
        let successCount = 0;
        for (const lead of leads) {
            try {
                await createContact({
                    email: lead.email || '',
                    first_name: lead.firstName || null,
                    last_name: lead.lastName || null,
                    company_name: lead.company?.name,
                    position: lead.position || null,
                    phone: lead.phone || null,
                    source: lead.source || 'hunter',
                    email_verified: lead.emailVerified,
                    email_verification_status: lead.emailVerificationStatus,
                    email_source: lead.source,
                    confidence_score: lead.confidence,
                });
                successCount++;
            } catch (error) {
                console.error('添加联系人失败:', lead.email, error);
            }
        }
        toast.success(`已成功添加 ${successCount} 个联系人`);
        loadContacts();
        setShowLeadSearch(false);
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-12">
            {/* Header */}
            <div className="mb-8">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm mb-3">
                    <Users className="mr-2 h-3 w-3" />
                    客户管理 · CRM
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">联系人管理</h1>
                        <p className="text-muted-foreground mt-1">
                            管理您的所有联系人，支持标签分组和批量操作
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowLeadSearch(true)}>
                            <Globe className="mr-2 h-4 w-4" />
                            线索搜索
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            导入
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            导出
                        </Button>
                        <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            添加联系人
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">总联系人</p>
                                <p className="text-2xl font-bold">{total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-4 mb-6">
                <form onSubmit={handleSearch} className="flex-1 max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索联系人..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </form>
                <Button variant="ghost" size="icon" onClick={loadContacts} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ContactsTable
                    contacts={contacts}
                    onRefresh={loadContacts}
                />
            )}

            {/* Add Contact Dialog */}
            <AddContactDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSuccess={loadContacts}
            />

            {/* Import Dialog */}
            <ImportDialog
                open={showImportDialog}
                onOpenChange={setShowImportDialog}
                onSuccess={loadContacts}
            />

            {/* Lead Search Dialog */}
            <Dialog open={showLeadSearch} onOpenChange={setShowLeadSearch}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            线索搜索
                        </DialogTitle>
                    </DialogHeader>
                    <LeadSearchPanel
                        onAddContact={handleAddLeadContact}
                        onAddContacts={handleAddLeadContacts}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
