'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useStudioStore, Page } from "@/lib/store"
import { Plus, Trash2, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTranslations } from 'next-intl'
import { validatePageName } from '@/lib/validation'

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

export function PageManager({ children }: { children: React.ReactNode }) {
    const t = useTranslations('studio')
    const { pages, setPages, currentPage, setCurrentPage, htmlContent } = useStudioStore()
    const [isOpen, setIsOpen] = useState(false)
    const [newPagePath, setNewPagePath] = useState('')
    const [cloneCurrent, setCloneCurrent] = useState(false) // 默认创建空白页面

    const handleAddPage = () => {
        const path = newPagePath.trim()
        if (!path) return

        // 验证页面名称
        const validation = validatePageName(path.replace('.html', ''))
        if (!validation.valid) {
            toast.error(t(validation.error as any))
            return
        }

        // Add .html extension if missing
        const finalPath = path.endsWith('.html') ? path : `${path}.html`

        if (pages.some(p => p.path === finalPath)) {
            toast.error(t('pageExists'))
            return
        }

        const newPage: Page = {
            path: finalPath,
            content: cloneCurrent ? htmlContent : emptyHtmlTemplate,
            // content_json removed
        }

        setPages([...pages, newPage])
        setNewPagePath('')
        setCloneCurrent(false)
        toast.success(t('pageCreated'))
    }

    const handleDeletePage = (e: React.MouseEvent, path: string) => {
        e.stopPropagation()

        if (path === 'index.html') {
            toast.error(t('cannotDeleteIndex'))
            return
        }

        // 统一使用 confirm 进行确认
        if (!confirm(t('confirmDeletePage'))) {
            return
        }

        const newPages = pages.filter(p => p.path !== path)
        setPages(newPages)

        if (currentPage === path) {
            setCurrentPage('index.html')
        }
        toast.success(t('pageDeleted'))
    }

    const handleSwitchPage = (path: string) => {
        setCurrentPage(path)
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('pageManager')}</DialogTitle>
                    <DialogDescription>
                        {t('pageManagerDesc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="new-page.html"
                                value={newPagePath}
                                onChange={(e) => setNewPagePath(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
                            />
                            <Button onClick={handleAddPage} size="icon">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <Label htmlFor="clone-current" className="text-muted-foreground cursor-pointer">
                                {cloneCurrent ? t('cloneCurrentPage') : t('createEmptyPage')}
                            </Label>
                            <Switch
                                id="clone-current"
                                checked={cloneCurrent}
                                onCheckedChange={setCloneCurrent}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {pages.map((page) => (
                            <div
                                key={page.path}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-md border transition-colors",
                                    currentPage === page.path
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:bg-muted/50"
                                )}
                            >
                                <div
                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                    onClick={() => handleSwitchPage(page.path)}
                                >
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{page.path}</span>
                                    {currentPage === page.path && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{t('current')}</Badge>
                                    )}
                                </div>

                                {page.path !== 'index.html' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => handleDeletePage(e, page.path)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
