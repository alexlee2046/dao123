'use client'

import { useState, useEffect } from 'react'
import { getUsers, updateUserCredits } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editCredits, setEditCredits] = useState(0)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const data = await getUsers()
            setUsers(data || [])
        } catch (error) {
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateCredits = async (userId: string) => {
        try {
            await updateUserCredits(userId, editCredits)
            toast.success("Credits updated")
            setEditingId(null)
            loadUsers()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <p className="text-muted-foreground">View users and manage their credits.</p>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {user.role || 'user'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {editingId === user.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={editCredits}
                                                onChange={(e) => setEditCredits(parseInt(e.target.value))}
                                                className="w-24 h-8"
                                            />
                                            <Button size="sm" onClick={() => handleUpdateCredits(user.id)}>
                                                <Save className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono">{user.credits}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                    setEditingId(user.id)
                                                    setEditCredits(user.credits)
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {user.created_at && formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    {/* Add more actions like ban/delete if needed */}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
