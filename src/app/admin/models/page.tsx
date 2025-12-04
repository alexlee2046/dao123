'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, Edit, Database, Loader2 } from "lucide-react"
import { getAllModels, createModel, updateModel, deleteModel, bulkImportModels, type ModelInput } from '@/lib/actions/admin-models'

interface Model extends ModelInput {
    created_at?: string
    updated_at?: string
}

// 2025年12月最新的OpenRouter推荐模型列表
const RECOMMENDED_MODELS: ModelInput[] = [
    // Chat Models - Premium
    { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', type: 'chat', enabled: true, is_free: false },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', type: 'chat', enabled: true, is_free: false },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: 'chat', enabled: true, is_free: false },
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google', type: 'chat', enabled: true, is_free: false },

    // Chat Models - Free/Efficient
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', provider: 'Google', type: 'chat', enabled: true, is_free: true },
    { id: 'deepseek/deepseek-v3.2-exp', name: 'DeepSeek V3.2 Experimental (Free)', provider: 'DeepSeek', type: 'chat', enabled: true, is_free: true },
    { id: 'deepseek/deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale', provider: 'DeepSeek', type: 'chat', enabled: true, is_free: false },
    { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder (Free)', provider: 'Qwen', type: 'chat', enabled: true, is_free: true },

    // Image Models
    { id: 'openai/dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', type: 'image', enabled: true, is_free: false },
    { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', provider: 'Black Forest Labs', type: 'image', enabled: true, is_free: false },

    // Video Models
    { id: 'luma/dream-machine', name: 'Luma Dream Machine', provider: 'Luma', type: 'video', enabled: true, is_free: false },
]

export default function AdminModelsPage() {
    const [models, setModels] = useState<Model[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingModel, setEditingModel] = useState<Model | null>(null)

    // Form state
    const [formData, setFormData] = useState<ModelInput>({
        id: '',
        name: '',
        provider: '',
        type: 'chat',
        enabled: true,
        is_free: false,
    })

    useEffect(() => {
        loadModels()
    }, [])

    const loadModels = async () => {
        try {
            setLoading(true)
            const data = await getAllModels()
            setModels(data)
        } catch (error: any) {
            toast.error(error.message || '加载模型失败')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            await createModel(formData)
            toast.success('模型创建成功')
            setDialogOpen(false)
            resetForm()
            loadModels()
        } catch (error: any) {
            toast.error(error.message || '创建失败')
        }
    }

    const handleUpdate = async () => {
        if (!editingModel) return
        try {
            await updateModel(editingModel.id, formData)
            toast.success('模型更新成功')
            setDialogOpen(false)
            resetForm()
            loadModels()
        } catch (error: any) {
            toast.error(error.message || '更新失败')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个模型吗?')) return
        try {
            await deleteModel(id)
            toast.success('模型删除成功')
            loadModels()
        } catch (error: any) {
            toast.error(error.message || '删除失败')
        }
    }

    const handleToggleEnabled = async (model: Model) => {
        try {
            await updateModel(model.id, { enabled: !model.enabled })
            toast.success('状态更新成功')
            loadModels()
        } catch (error: any) {
            toast.error(error.message || '更新失败')
        }
    }

    const handleBulkImport = async () => {
        if (!confirm(`确定要导入 ${RECOMMENDED_MODELS.length} 个推荐模型吗? 这会覆盖已存在的模型配置。`)) return
        try {
            await bulkImportModels(RECOMMENDED_MODELS)
            toast.success('批量导入成功')
            loadModels()
        } catch (error: any) {
            toast.error(error.message || '导入失败')
        }
    }

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            provider: '',
            type: 'chat',
            enabled: true,
            is_free: false,
        })
        setEditingModel(null)
    }

    const openEditDialog = (model: Model) => {
        setEditingModel(model)
        setFormData({
            id: model.id,
            name: model.name,
            provider: model.provider,
            type: model.type,
            enabled: model.enabled,
            is_free: model.is_free,
        })
        setDialogOpen(true)
    }

    const openCreateDialog = () => {
        resetForm()
        setDialogOpen(true)
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-10 px-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">模型管理</h1>
                    <p className="text-muted-foreground mt-1">管理AI模型配置和启用状态</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBulkImport}>
                        <Database className="h-4 w-4 mr-2" />
                        导入推荐模型
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        添加模型
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>已配置模型</CardTitle>
                    <CardDescription>
                        共 {models.length} 个模型 · {models.filter(m => m.enabled).length} 个已启用
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>模型ID</TableHead>
                                    <TableHead>名称</TableHead>
                                    <TableHead>提供商</TableHead>
                                    <TableHead>类型</TableHead>
                                    <TableHead>免费</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {models.map((model) => (
                                    <TableRow key={model.id}>
                                        <TableCell className="font-mono text-xs">{model.id}</TableCell>
                                        <TableCell className="font-medium">{model.name}</TableCell>
                                        <TableCell>{model.provider}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                model.type === 'chat' ? 'default' :
                                                    model.type === 'image' ? 'secondary' : 'outline'
                                            }>
                                                {model.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {model.is_free ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Free
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                                    Paid
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={model.enabled}
                                                onCheckedChange={() => handleToggleEnabled(model)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(model)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(model.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingModel ? '编辑模型' : '添加新模型'}</DialogTitle>
                        <DialogDescription>
                            {editingModel ? '修改模型配置信息' : '添加一个新的AI模型到系统'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="id">模型ID *</Label>
                            <Input
                                id="id"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                placeholder="例如: openai/gpt-4o"
                                disabled={!!editingModel}
                            />
                            <p className="text-xs text-muted-foreground">
                                OpenRouter格式: provider/model-name
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">显示名称 *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例如: GPT-4o"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="provider">提供商 *</Label>
                            <Input
                                id="provider"
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                placeholder="例如: OpenAI"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">类型 *</Label>
                            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="chat">Chat</SelectItem>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="is_free">免费模型</Label>
                            <Switch
                                id="is_free"
                                checked={formData.is_free}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enabled">启用状态</Label>
                            <Switch
                                id="enabled"
                                checked={formData.enabled}
                                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            取消
                        </Button>
                        <Button onClick={editingModel ? handleUpdate : handleCreate}>
                            {editingModel ? '更新' : '创建'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
