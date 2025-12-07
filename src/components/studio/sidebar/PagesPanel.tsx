import React from 'react';
import { useStudioStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export const PagesPanel = () => {
    const t = useTranslations('studio');
    const { pages, setPages, currentPage, setCurrentPage, htmlContent, builderData } = useStudioStore();
    const [isCreating, setIsCreating] = React.useState(false);
    const [newPageName, setNewPageName] = React.useState('');

    const handleCreate = () => {
        const path = newPageName.trim();
        if (!path) {
            setIsCreating(false);
            return;
        }
        
        const finalPath = path.endsWith('.html') ? path : `${path}.html`;
        
        if (pages.some(p => p.path === finalPath)) {
            toast.error(t('pageExists'));
            return;
        }

        const newPage = {
            path: finalPath,
            content: htmlContent, // Clone current content as a template
            content_json: builderData || undefined
        };

        setPages([...pages, newPage]);
        setCurrentPage(finalPath);
        setIsCreating(false);
        setNewPageName('');
        toast.success(t('pageCreated'));
    };

    const handleDelete = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        if (path === 'index.html') return;
        if (confirm(t('confirmDeletePage'))) {
            const newPages = pages.filter(p => p.path !== path);
            setPages(newPages);
            if (currentPage === path) setCurrentPage('index.html');
            toast.success(t('pageDeleted'));
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('pages')}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-background" onClick={() => setIsCreating(true)}>
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>
            
            {isCreating && (
                <div className="p-2 border-b bg-muted/10 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-1 items-center">
                        <Input 
                            value={newPageName} 
                            onChange={e => setNewPageName(e.target.value)}
                            placeholder="page-name"
                            className="h-7 text-xs flex-1 bg-background"
                            autoFocus
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleCreate();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-primary/10 hover:text-primary" onClick={handleCreate}>
                            <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsCreating(false)}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {pages.map(page => (
                        <div 
                            key={page.path}
                            onClick={() => setCurrentPage(page.path)}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm group transition-all border",
                                currentPage === page.path 
                                    ? "bg-primary/5 border-primary/20 text-primary font-medium shadow-sm" 
                                    : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate flex-1">
                                <FileText className={cn("h-3.5 w-3.5", currentPage === page.path ? "opacity-100" : "opacity-70")} />
                                <span className="truncate" title={page.path}>{page.path}</span>
                            </div>
                            
                            {page.path !== 'index.html' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => handleDelete(e, page.path)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
