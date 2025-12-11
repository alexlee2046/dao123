'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, RefreshCw } from "lucide-react"
import { format } from 'date-fns'

interface Log {
    id: string
    created_at: string
    type: string
    model: string
    status: string
    duration_ms: number
    input_snippet: string
    output_snippet: string
    error: string
    meta: any
}

export default function AiLogsPage() {
    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('ai_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

        if (data) setLogs(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">AI Logs</h2>
                <Button onClick={fetchLogs} variant="outline" size="sm">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent 50 Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[160px]">Time</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px]">Type</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[200px]">Model</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px]">Status</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[100px]">Duration</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Snippet</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[80px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle">{format(new Date(log.created_at), 'MM-dd HH:mm:ss')}</td>
                                        <td className="p-4 align-middle font-medium">{log.type}</td>
                                        <td className="p-4 align-middle">{log.model || '-'}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                                                {log.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle">{log.duration_ms}ms</td>
                                        <td className="p-4 align-middle max-w-[200px] truncate text-muted-foreground font-mono text-xs">
                                            {log.error || log.output_snippet}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                                                    <DialogHeader>
                                                        <DialogTitle>Log Details - {log.id}</DialogTitle>
                                                    </DialogHeader>
                                                    <ScrollArea className="flex-1 pr-4">
                                                        <div className="space-y-6 pb-6">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1">
                                                                    <span className="text-sm font-medium text-muted-foreground">Type</span>
                                                                    <p>{log.type}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-sm font-medium text-muted-foreground">Model</span>
                                                                    <p>{log.model}</p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                                                                    <p><Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>{log.status}</Badge></p>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-sm font-medium text-muted-foreground">Duration</span>
                                                                    <p>{log.duration_ms}ms</p>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Input</h4>
                                                                <pre className="bg-muted p-4 rounded-lg text-xs whitespace-pre-wrap font-mono break-all">
                                                                    {log.input_snippet}
                                                                </pre>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Output / Error</h4>
                                                                <pre className="bg-muted p-4 rounded-lg text-xs whitespace-pre-wrap font-mono break-all">
                                                                    {log.meta?.full_output || log.output_snippet || log.error}
                                                                </pre>
                                                            </div>

                                                            {log.meta && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold mb-2">Metadata</h4>
                                                                    <pre className="bg-muted p-4 rounded-lg text-xs whitespace-pre-wrap font-mono break-all">
                                                                        {JSON.stringify(log.meta, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && !loading && (
                            <div className="text-center py-10 text-muted-foreground">No logs found</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
