'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { addComment, getComments, addRating } from "@/lib/actions/community"
import { toast } from "sonner"
import { Star, User } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'

interface CommentsSectionProps {
    projectId: string
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [rating, setRating] = useState(0)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        loadComments()
    }, [projectId])

    const loadComments = async () => {
        try {
            const data = await getComments(projectId)
            setComments(data || [])
        } catch (error) {
            console.error(error)
        }
    }

    const handleSubmit = async () => {
        if (!newComment.trim()) return

        try {
            setSubmitting(true)
            await addComment(projectId, newComment)
            if (rating > 0) {
                await addRating(projectId, rating)
            }
            setNewComment('')
            setRating(0)
            loadComments()
            toast.success("评论已添加")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">发表评价</h3>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`focus:outline-none transition-colors ${rating >= star ? 'text-amber-500' : 'text-muted-foreground'}`}
                        >
                            <Star className="h-6 w-6 fill-current" />
                        </button>
                    ))}
                </div>
                <Textarea
                    placeholder="分享您的想法..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()}>
                    发布评价
                </Button>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">评论 ({comments.length})</h3>
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-4 border rounded-lg">
                        <Avatar>
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-sm">User</p>
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
