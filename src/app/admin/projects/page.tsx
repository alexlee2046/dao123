import { createClient } from "@/lib/supabase/server"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatDistanceToNow } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getAllProjects() {
    'use server'
    const supabase = await createClient()

    // Admin check is done in layout, but good to be safe if this was a public action
    // Here we assume this component is only rendered in admin layout

    const { data } = await supabase
        .from('projects')
        .select('*, user:user_id(email)')
        .order('updated_at', { ascending: false })

    return data || []
}

export default async function AdminProjectsPage() {
    const projects = await getAllProjects()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">项目管理</h2>
                <p className="text-muted-foreground">查看所有用户项目。</p>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>名称</TableHead>
                            <TableHead>用户</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>价格</TableHead>
                            <TableHead>最后更新</TableHead>
                            <TableHead>操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map((project: any) => (
                            <TableRow key={project.id}>
                                <TableCell className="font-medium">{project.name}</TableCell>
                                <TableCell>{project.user?.email}</TableCell>
                                <TableCell>
                                    {project.is_public ? (
                                        <Badge variant="default">公开</Badge>
                                    ) : (
                                        <Badge variant="secondary">私有</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{project.price > 0 ? `${project.price} 积分` : '免费'}</TableCell>
                                <TableCell>
                                    {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                                </TableCell>
                                <TableCell>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/community/${project.id}`} target="_blank">
                                            查看
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
