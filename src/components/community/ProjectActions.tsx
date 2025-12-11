'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { purchaseProject } from "@/lib/actions/community"
import { toast } from "sonner"
import { Loader2, ShoppingCart, Copy, Download } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useStudioStore } from "@/lib/store"
import { useTranslations, useLocale } from 'next-intl'

interface ProjectActionsProps {
    projectId: string
    price: number
    hasAccess: boolean
    projectData: any
}

export function ProjectActions({ projectId, price, hasAccess, projectData }: ProjectActionsProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { setHtmlContent, setPages, setCurrentProject } = useStudioStore()
    const t = useTranslations('community')
    const tCommon = useTranslations('common')
    const locale = useLocale()

    const handlePurchase = async () => {
        try {
            setLoading(true)
            await purchaseProject(projectId)
            toast.success(t('purchaseSuccess'))
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleClone = () => {
        // Load into studio
        if (projectData.content?.pages && projectData.content.pages.length > 0) {
            setPages(projectData.content.pages)
            setCurrentProject(null)
            toast.success(t('cloneSuccess'))
            router.push(`/${locale}/studio/new`)
        } else if (projectData.content?.html) {
            setHtmlContent(projectData.content.html)
            setCurrentProject(null)
            toast.success(t('cloneSuccess'))
            router.push(`/${locale}/studio/new`)
        } else {
            toast.error(t('emptyContentError'))
        }
    }

    const handleDownload = () => {
        const url = projectData.content?.url || projectData.preview_image
        if (url) {
            window.open(url, '_blank')
        } else {
            toast.error(t('emptyContentError'))
        }
    }

    if (hasAccess) {
        if (projectData.project_type === 'image' || projectData.project_type === 'video') {
            return (
                <Button onClick={handleDownload} className="w-full md:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    {tCommon('download')}
                </Button>
            )
        }

        return (
            <Button onClick={handleClone} className="w-full md:w-auto">
                <Copy className="h-4 w-4 mr-2" />
                {t('cloneToStudioBtn')}
            </Button>
        )
    }

    return (
        <Button onClick={handlePurchase} disabled={loading} className="w-full md:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            {t('purchaseBtn', { price, unit: tCommon('credits') })}
        </Button>
    )
}
