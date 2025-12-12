import React from 'react';
import { useStudioStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Trash2, Check, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { validatePageName } from '@/lib/validation';

// 空白 HTML 模板
const emptyHtmlTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white min-h-screen">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-800">New Page</h1>
      <p class="text-gray-600 mt-4">Start editing this page...</p>
    </div>
  </body>
</html>
`

export const PagesPanel = () => {
    const t = useTranslations('studio');
    const { pages, setPages, currentPage, setCurrentPage, htmlContent } = useStudioStore();
    const [isCreating, setIsCreating] = React.useState(false);
    const [newPageName, setNewPageName] = React.useState('');
    const [cloneCurrent, setCloneCurrent] = React.useState(false);

    const handleCreate = () => {
        const path = newPageName.trim();
        if (!path) {
            setIsCreating(false);
            return;
        }

        // 验证页面名称
        const validation = validatePageName(path.replace('.html', ''));
        if (!validation.valid) {
            toast.error(t(validation.error as any));
            return;
        }

        const finalPath = path.endsWith('.html') ? path : `${path}.html`;

        if (pages.some(p => p.path === finalPath)) {
            toast.error(t('pageExists'));
            return;
        }

        const newPage = {
            path: finalPath,
            content: cloneCurrent ? htmlContent : emptyHtmlTemplate,
            // content_json removed
        };

        setPages([...pages, newPage]);
        setCurrentPage(finalPath);
        setIsCreating(false);
        setNewPageName('');
        setCloneCurrent(false);
        toast.success(t('pageCreated'));
    };

    const handleDelete = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        if (path === 'index.html') {
            toast.error(t('cannotDeleteIndex'));
            return;
        }
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
                    <div className="flex gap-1 items-center mb-2">
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
                    <button
                        className={cn(
                            "flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors w-full",
                            cloneCurrent
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => setCloneCurrent(!cloneCurrent)}
                    >
                        <Copy className="h-3 w-3" />
                        <span>{cloneCurrent ? t('cloneCurrentPage') : t('createEmptyPage')}</span>
                    </button>
                </div>
            )}

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                    {pages.map(page => (
                        <div
                            key={page.path}
                            onClick={() => setCurrentPage(page.path)}
                            className={cn(
                                "relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm group transition-all duration-200",
                                currentPage === page.path
                                    ? "bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30 hover:shadow-sm"
                            )}
                        >
                            {/* Active Indicator Bar */}
                            {currentPage === page.path && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r-full" />
                            )}

                            <div className="flex items-center gap-3 truncate flex-1 pl-1">
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    currentPage === page.path ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                                )}>
                                    <FileText className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate font-medium -tracking-tight" title={page.path}>{page.path}</span>
                            </div>

                            {page.path !== 'index.html' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg scale-90 group-hover:scale-100"
                                    onClick={(e) => handleDelete(e, page.path)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
