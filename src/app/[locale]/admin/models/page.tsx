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
import { useTranslations } from 'next-intl'

interface Model extends ModelInput {
    created_at?: string
    updated_at?: string
    cost_per_unit: number
}

// 2025年12月最新的OpenRouter推荐模型列表
const RECOMMENDED_MODELS: ModelInput[] = [
    // Chat Models - Premium
    { id: 'openai/gpt-5', name: 'GPT-5 (最强推理)', provider: 'OpenAI', type: 'chat', enabled: true, is_free: false, cost_per_unit: 20 },
    { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini (高性价比)', provider: 'OpenAI', type: 'chat', enabled: true, is_free: false, cost_per_unit: 5 },
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3.0 Pro (旗舰版)', provider: 'Google', type: 'chat', enabled: true, is_free: false, cost_per_unit: 10 },

    // Chat Models - Free/Efficient
    { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2 (极致性价比)', provider: 'DeepSeek', type: 'chat', enabled: true, is_free: true, cost_per_unit: 1 },
    { id: 'deepseek/deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale (高性能版)', provider: 'DeepSeek', type: 'chat', enabled: true, is_free: false, cost_per_unit: 3 },
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B (开源之王)', provider: 'Qwen', type: 'chat', enabled: true, is_free: true, cost_per_unit: 2 },

    // Image Models
    { id: 'openai/dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', type: 'image', enabled: true, is_free: false, cost_per_unit: 25 },
    { id: 'black-forest-labs/flux-1.1-pro', name: 'Flux 1.1 Pro', provider: 'Black Forest Labs', type: 'image', enabled: true, is_free: false, cost_per_unit: 25 },

    // Video Models
    { id: 'luma/dream-machine', name: 'Luma Dream Machine', provider: 'Luma', type: 'video', enabled: true, is_free: false, cost_per_unit: 200 },
]

export default function AdminModelsPage() {
    const t = useTranslations('admin')
    const tCommon = useTranslations('common')
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
        cost_per_unit: 1,
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
            toast.error(error.message || t('loadModelsFailed'))
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            await createModel(formData)
            toast.success(t('modelCreated'))
            setDialogOpen(false)
            resetForm()
            loadModels()
        } catch (error: any) {
            toast.error(error.message || t('loadFailed'))
        }
    }

    const handleUpdate = async () => {
        if (!editingModel) return
        try {
            await updateModel(editingModel.id, formData)
            toast.success(t('modelUpdated'))
            setDialogOpen(false)
            resetForm()
            loadModels()
        } catch (error: any) {
            toast.error(error.message || t('loadFailed'))
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('confirmDeleteModel'))) return
        try {
            await deleteModel(id)
            toast.success(t('modelDeleted'))
            loadModels()
        } catch (error: any) {
            toast.error(error.message || t('loadFailed'))
        }
    }

    const handleToggleEnabled = async (model: Model) => {
        try {
            await updateModel(model.id, { enabled: !model.enabled })
            toast.success(t('statusUpdated'))
            loadModels()
        } catch (error: any) {
            toast.error(error.message || t('loadFailed'))
        }
    }

    const handleBulkImport = async () => {
        if (!confirm(t('confirmImportModels', { count: RECOMMENDED_MODELS.length }))) return
        try {
            await bulkImportModels(RECOMMENDED_MODELS)
            toast.success(t('bulkImportSuccess'))
            loadModels()
        } catch (error: any) {
            toast.error(error.message || t('loadFailed'))
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
            cost_per_unit: 1,
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
            cost_per_unit: model.cost_per_unit || 1,
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
                    <h1 className="text-3xl font-bold tracking-tight">{t('models')}</h1>
                    <p className="text-muted-foreground mt-1">{t('modelsDesc')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBulkImport}>
                        <Database className="h-4 w-4 mr-2" />
                        {t('importRecommended')}
                    </Button>
                    <Button onClick={openCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('addModel')}
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('configuredModels')}</CardTitle>
                    <CardDescription>
                        {t('modelsCount', { total: models.length, enabled: models.filter(m => m.enabled).length })}
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
                                    <TableHead>{t('table.modelId')}</TableHead>
                                    <TableHead>{t('table.name')}</TableHead>
                                    <TableHead>{t('table.provider')}</TableHead>
                                    <TableHead>{t('table.type')}</TableHead>
                                    <TableHead>积分消耗</TableHead>
                                    <TableHead>{t('table.free')}</TableHead>
                                    <TableHead>{t('table.status')}</TableHead>
                                    <TableHead className="text-right">{t('table.actions')}</TableHead>
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
                                        <TableCell className="font-mono">
                                            {model.cost_per_unit || 1}
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
                        <DialogTitle>{editingModel ? t('form.editModelTitle') : t('form.addNewModel')}</DialogTitle>
                        <DialogDescription>
                            {editingModel ? t('form.editModelDesc') : t('form.addNewModelDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="id">{t('form.modelId')} *</Label>
                            <Input
                                id="id"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                placeholder={t('form.modelIdPlaceholder')}
                                disabled={!!editingModel}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('form.modelIdHint')}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('form.displayName')} *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('form.displayNamePlaceholder')}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="provider">{t('form.provider')} *</Label>
                            <Input
                                id="provider"
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                placeholder={t('form.providerPlaceholder')}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="type">{t('form.type')} *</Label>
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
                        <div className="grid gap-2">
                            <Label htmlFor="cost_per_unit">积分消耗 (每次)</Label>
                            <Input
                                id="cost_per_unit"
                                type="number"
                                min="0"
                                value={formData.cost_per_unit || 1}
                                onChange={(e) => setFormData({ ...formData, cost_per_unit: parseInt(e.target.value) || 1 })}
                                placeholder="1"
                            />
                            <p className="text-xs text-muted-foreground">
                                用户每次使用该模型消耗的积分数量
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="is_free">{t('form.freeModel')}</Label>
                            <Switch
                                id="is_free"
                                checked={formData.is_free}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="enabled">{t('form.enabledStatus')}</Label>
                            <Switch
                                id="enabled"
                                checked={formData.enabled}
                                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            {tCommon('cancel')}
                        </Button>
                        <Button onClick={editingModel ? handleUpdate : handleCreate}>
                            {editingModel ? t('form.update') : t('form.create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
