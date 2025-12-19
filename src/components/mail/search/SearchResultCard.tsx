'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Mail,
    User,
    Briefcase,
    Shield,
    ShieldCheck,
    Plus,
    ExternalLink,
    Linkedin
} from 'lucide-react';
import { SearchResult } from '@/lib/actions/mail/search';
import { ContactResult } from '@/lib/mail/data-adapter/types';

interface SearchResultCardProps {
    result: SearchResult;
    onSaveContact?: (contact: ContactResult) => void;
    onSaveAll?: () => void;
}

function ConfidenceBadge({ score }: { score: number | null }) {
    if (score === null) return null;

    const getColor = () => {
        if (score >= 90) return 'bg-green-500/10 text-green-600 border-green-500/20';
        if (score >= 70) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
        return 'bg-red-500/10 text-red-600 border-red-500/20';
    };

    return (
        <Badge variant="outline" className={`text-xs ${getColor()}`}>
            {score}%
        </Badge>
    );
}

function ContactRow({ contact, onSave }: { contact: ContactResult; onSave?: () => void }) {
    return (
        <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 rounded-lg transition-colors group">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* 头像 */}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                </div>

                {/* 信息 */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                            {contact.first_name || ''} {contact.last_name || ''}
                            {!contact.first_name && !contact.last_name && contact.email.split('@')[0]}
                        </span>
                        {contact.is_verified && (
                            <ShieldCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        <ConfidenceBadge score={contact.confidence_score} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {contact.email}
                        </span>
                        {contact.position && (
                            <span className="flex items-center gap-1 truncate">
                                <Briefcase className="h-3 w-3 flex-shrink-0" />
                                {contact.position}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {contact.linkedin_url && (
                    <Button variant="ghost" size="icon" asChild>
                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                        </a>
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={onSave}>
                    <Plus className="mr-1 h-3 w-3" />
                    保存
                </Button>
            </div>
        </div>
    );
}

export function SearchResultCard({ result, onSaveContact, onSaveAll }: SearchResultCardProps) {
    const { company, contacts, error } = result;

    if (error) {
        return (
            <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                    <p className="text-destructive text-center">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!company && contacts.length === 0) {
        return (
            <Card className="bg-muted/30">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">未找到相关数据，请尝试其他域名。</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            {/* 公司信息头部 */}
            {company && (
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">{company.name || company.domain}</CardTitle>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>{company.domain}</span>
                                    {company.industry && (
                                        <>
                                            <span>·</span>
                                            <span>{company.industry}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1 h-3 w-3" />
                                访问官网
                            </a>
                        </Button>
                    </div>
                </CardHeader>
            )}

            {/* 联系人列表 */}
            <CardContent className="p-0">
                {contacts.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                            <span className="text-sm font-medium">
                                找到 {contacts.length} 个联系人
                            </span>
                            {onSaveAll && (
                                <Button variant="default" size="sm" onClick={onSaveAll}>
                                    <Plus className="mr-1 h-3 w-3" />
                                    全部保存
                                </Button>
                            )}
                        </div>
                        <div className="divide-y">
                            {contacts.map((contact, index) => (
                                <ContactRow
                                    key={contact.email || index}
                                    contact={contact}
                                    onSave={() => onSaveContact?.(contact)}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="p-6 text-center text-muted-foreground">
                        未找到该公司的联系人邮箱
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
