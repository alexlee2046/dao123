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
import { Globe, Coins, Loader2 } from "lucide-react"
import { publishProject } from "@/lib/actions/community"
import { useStudioStore } from "@/lib/store"
import { toast } from "sonner"

export function PublishToCommunityModal({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false)
    const [price, setPrice] = useState(0)
    const [isFree, setIsFree] = useState(true)
    const [loading, setLoading] = useState(false)
    const { currentProject } = useStudioStore()

    const handlePublish = async () => {
        if (!currentProject?.id) {
            toast.error("Please save your project first")
            return
        }

        try {
            setLoading(true)
            await publishProject(currentProject.id, isFree ? 0 : price)
            toast.success("Project published to community!")
            setIsOpen(false)
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
                    <DialogTitle>Share to Community</DialogTitle>
                    <DialogDescription>
                        Share your project with the community. You can set a price in credits.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="free-mode">Free Project</Label>
                        <Switch
                            id="free-mode"
                            checked={isFree}
                            onCheckedChange={setIsFree}
                        />
                    </div>

                    {!isFree && (
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price (Credits)</Label>
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
                                You will receive 80% of the revenue.
                            </p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handlePublish} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Publish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
