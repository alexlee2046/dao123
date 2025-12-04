'use client'

import { useState, useEffect } from 'react'
import { getSystemSettings, updateSystemSetting } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await getSystemSettings()
            setSettings(data || [])
        } catch (error) {
            toast.error("Failed to load settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (key: string, value: string) => {
        try {
            setSaving(key)
            await updateSystemSetting(key, value)
            toast.success("Setting updated")
            loadSettings()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(null)
        }
    }

    const defaultKeys = [
        { key: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key', description: 'AI 生成的全局 API Key' },
        { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', description: 'Stripe 支付密钥' },
        { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', description: 'Stripe Webhook 验证密钥' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">系统设置</h2>
                <p className="text-muted-foreground">管理全局配置和 API 密钥。</p>
            </div>

            <div className="grid gap-6">
                {defaultKeys.map((item) => {
                    const setting = settings.find(s => s.key === item.key)
                    return (
                        <Card key={item.key}>
                            <CardHeader>
                                <CardTitle>{item.label}</CardTitle>
                                <CardDescription>{item.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4">
                                    <Input
                                        type="password"
                                        defaultValue={setting?.value || ''}
                                        placeholder={`请输入 ${item.label}`}
                                        onChange={(e) => {
                                            // Optional: local state update if needed, but we save on button click
                                        }}
                                        id={`input-${item.key}`}
                                    />
                                    <Button
                                        onClick={() => {
                                            const input = document.getElementById(`input-${item.key}`) as HTMLInputElement
                                            handleSave(item.key, input.value)
                                        }}
                                        disabled={saving === item.key}
                                    >
                                        {saving === item.key && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        保存
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
