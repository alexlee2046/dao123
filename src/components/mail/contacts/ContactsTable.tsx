'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontal,
    Trash2,
    Edit,
    Mail,
    Tag,
    User,
    Building2,
    Loader2
} from 'lucide-react';
import { Contact, deleteContact, bulkDeleteContacts } from '@/lib/actions/mail/contacts';
import { toast } from 'sonner';
import { EmailVerifyBadge } from './EmailVerifyBadge';

interface ContactsTableProps {
    contacts: Contact[];
    onRefresh: () => void;
    onEdit?: (contact: Contact) => void;
}

export function ContactsTable({ contacts, onRefresh, onEdit }: ContactsTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === contacts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(contacts.map(c => c.id)));
        }
    };

    const handleDelete = async (id: string) => {
        const result = await deleteContact(id);
        if (result.success) {
            toast.success('联系人已删除');
            onRefresh();
        } else {
            toast.error(result.error || '删除失败');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;

        setIsDeleting(true);
        const result = await bulkDeleteContacts(Array.from(selectedIds));
        setIsDeleting(false);

        if (result.success) {
            toast.success(`已删除 ${selectedIds.size} 个联系人`);
            setSelectedIds(new Set());
            onRefresh();
        } else {
            toast.error(result.error || '批量删除失败');
        }
    };

    const getInitials = (contact: Contact) => {
        if (contact.first_name && contact.last_name) {
            return `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
        }
        if (contact.first_name) return contact.first_name[0].toUpperCase();
        return contact.email[0].toUpperCase();
    };

    const getDisplayName = (contact: Contact) => {
        if (contact.first_name || contact.last_name) {
            return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        }
        return contact.email.split('@')[0];
    };

    if (contacts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">暂无联系人</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    使用搜客引擎查找联系人，或手动添加
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-4 p-3 mb-4 bg-muted/50 rounded-lg border">
                    <span className="text-sm font-medium">
                        已选择 {selectedIds.size} 个联系人
                    </span>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        取消选择
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        批量删除
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={selectedIds.size === contacts.length && contacts.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>联系人</TableHead>
                            <TableHead>邮箱</TableHead>
                            <TableHead>职位</TableHead>
                            <TableHead>标签</TableHead>
                            <TableHead>来源</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.map((contact) => (
                            <TableRow key={contact.id} className="group">
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.has(contact.id)}
                                        onCheckedChange={() => toggleSelect(contact.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                            {getInitials(contact)}
                                        </div>
                                        <span className="font-medium">{getDisplayName(contact)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        {contact.email}
                                        <EmailVerifyBadge
                                            verified={contact.email_verified}
                                            status={contact.email_verification_status}
                                            className="ml-1 scale-90"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {contact.position ? (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Building2 className="h-3 w-3 text-muted-foreground" />
                                            {contact.position}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {contact.tags && contact.tags.length > 0 ? (
                                            contact.tags.slice(0, 3).map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                        {contact.tags && contact.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{contact.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                        <Badge variant="outline" className="text-xs capitalize">
                                            {contact.source || 'unknown'}
                                        </Badge>
                                        {contact.email_source && contact.email_source !== contact.source && (
                                            <span className="text-[10px] text-muted-foreground">
                                                Email: {contact.email_source}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                编辑
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Tag className="mr-2 h-4 w-4" />
                                                添加标签
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDelete(contact.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                删除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
