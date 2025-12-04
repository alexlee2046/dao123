'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { purchaseProject } from "@/lib/actions/community"
import { toast } from "sonner"
import { Loader2, ShoppingCart, Copy } from "lucide-react"
import { useRouter } from 'next/navigation'
import { useStudioStore } from "@/lib/store"

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

    const handlePurchase = async () => {
        try {
            setLoading(true)
            await purchaseProject(projectId)
            toast.success("Project purchased successfully!")
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
            setCurrentProject(null) // New project based on this one
            toast.success("Project cloned to Studio!")
            router.push('/studio/new')
        } else if (projectData.content?.html) {
            setHtmlContent(projectData.content.html)
            setCurrentProject(null) // New project based on this one
            toast.success("Project cloned to Studio!")
            router.push('/studio/new')
        } else {
            toast.error("Project content is empty")
        }
    }

    if (hasAccess) {
        return (
            <Button onClick={handleClone} className="w-full md:w-auto">
                <Copy className="h-4 w-4 mr-2" />
                Clone to Studio
            </Button>
        )
    }

    return (
        <Button onClick={handlePurchase} disabled={loading} className="w-full md:w-auto">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
            Purchase for {price} Credits
        </Button>
    )
}
