'use client'

import { useState, useEffect } from 'react'
import { getAllAssets, adminDeleteAsset } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, Trash2, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

export default function AdminAssetsPage() {
    const [assets, setAssets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        loadAssets()
    }, [])

    const loadAssets = async () => {
        try {
            const data = await getAllAssets()
            setAssets(data || [])
        } catch (error) {
            toast.error("Failed to load assets")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, url: string) => {
        if (!confirm("Are you sure you want to delete this asset? This cannot be undone.")) return

        try {
            setDeletingId(id)
            await adminDeleteAsset(id, url)
            toast.success("Asset deleted")
            loadAssets()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
                <p className="text-muted-foreground">View and moderate user uploads.</p>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Preview</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assets.map((asset) => (
                            <TableRow key={asset.id}>
                                <TableCell>
                                    <div className="relative h-16 w-16 rounded overflow-hidden bg-muted">
                                        {asset.type === 'image' ? (
                                            <Image
                                                src={asset.url}
                                                alt={asset.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                                {asset.type}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium max-w-[200px] truncate" title={asset.name}>
                                    {asset.name}
                                </TableCell>
                                <TableCell>{asset.type}</TableCell>
                                <TableCell>{asset.user?.email}</TableCell>
                                <TableCell>
                                    {asset.created_at && formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button asChild size="sm" variant="ghost">
                                            <a href={asset.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(asset.id, asset.url)}
                                            disabled={deletingId === asset.id}
                                        >
                                            {deletingId === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
