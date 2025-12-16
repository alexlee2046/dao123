'use client';

import { useWizardStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contact, getContacts } from '@/lib/actions/mail/contacts';
import { useEffect, useState } from 'react';
import { Users, Tag, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function StepAudience() {
    const { data, updateData } = useWizardStore();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContacts = async () => {
            const res = await getContacts({ pageSize: 100 }); // Fetch first 100 for now. Ideal: Search/Select Modal.
            setContacts(res.contacts);
            setLoading(false);
        };
        fetchContacts();
    }, []);

    const toggleContact = (id: string) => {
        const current = new Set(data.audienceIds);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        updateData({ audienceIds: Array.from(current) });
    };

    const selectAll = () => {
        if (data.audienceIds.length === contacts.length) {
            updateData({ audienceIds: [] });
        } else {
            updateData({ audienceIds: contacts.map(c => c.id) });
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Select Audience</CardTitle>
                <CardDescription>Who should receive this email?</CardDescription>
                <div className="flex justify-between items-center mt-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                        {data.audienceIds.length === contacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Selected: {data.audienceIds.length}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] border-t border-b">
                        <div className="divide-y">
                            {contacts.map(contact => {
                                const isSelected = data.audienceIds.includes(contact.id);
                                return (
                                    <div
                                        key={contact.id}
                                        className={cn(
                                            "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                                            isSelected && "bg-primary/5"
                                        )}
                                        onClick={() => toggleContact(contact.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-5 w-5 rounded border flex items-center justify-center",
                                                isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">{contact.email}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
                                                    {contact.company_name && ` • ${contact.company_name}`}
                                                </div>
                                            </div>
                                        </div>
                                        {contact.tags && contact.tags.length > 0 && (
                                            <div className="flex gap-1">
                                                {contact.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary" className="text-xs h-5 px-1">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
                <div className="p-4 bg-muted/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>AI Suggestion: You have {contacts.length} total contacts. Try creating segments based on engagement.</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
