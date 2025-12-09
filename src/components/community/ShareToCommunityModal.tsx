'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Coins, Loader2 } from "lucide-react"
import { publishProject, publishAssetToCommunity } from "@/lib/actions/community"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { Textarea } from '@/components/ui/textarea'

interface ShareToCommunityModalProps {
    children: React.ReactNode
    entityId: string
    type: 'project' | 'asset'
    defaultName?: string
    onSuccess?: () => void
}

export function ShareToCommunityModal({
    children,
    entityId,
    type,
    defaultName = '',
    onSuccess
}: ShareToCommunityModalProps) {
    const t = useTranslations('publish')
    const [isOpen, setIsOpen] = useState(false)
    const [price, setPrice] = useState(0)
    const [isFree, setIsFree] = useState(true)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(defaultName)
    const [description, setDescription] = useState('')

    const handlePublish = async () => {
        if (!entityId) {
            toast.error(t('saveFirst'))
            return
        }

        try {
            setLoading(true)

            if (type === 'project') {
                await publishProject(entityId, isFree ? 0 : price)
            } else {
                await publishAssetToCommunity(entityId, isFree ? 0 : price, name, description)
            }

            toast.success(t('publishedToCommunity'))
            setIsOpen(false)
            if (onSuccess) onSuccess()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('communityTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('communityDesc')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {type === 'asset' && (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('labelName')}</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">{t('labelDescription')}</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    placeholder="Add a description..."
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="free-mode">{t('freeProject')}</Label>
                        <Switch
                            id="free-mode"
                            checked={isFree}
                            onCheckedChange={setIsFree}
                        />
                    </div>

                    {!isFree && (
                        <div className="grid gap-2">
                            <Label htmlFor="price">{t('price')}</Label>
                            <div className="relative">
                                <Coins className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="price"
                                    type="number"
                                    min="1"
                                    value={price}
                                    onChange={(e) => setPrice(parseInt(e.target.value))}
                                    className="pl-8"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('earningsNote')}
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handlePublish} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {t('publishBtn')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
