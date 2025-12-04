'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { CreditCard, User, Coins, Loader2 } from "lucide-react"
import { getCredits } from "@/lib/actions/credits"
import { createClient } from "@/lib/supabase/client"

export default function SettingsPage() {
    const [credits, setCredits] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [purchasing, setPurchasing] = useState(false)
    const [userEmail, setUserEmail] = useState('')



    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserEmail(user.email || '')

            const creditBalance = await getCredits()
            setCredits(creditBalance)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handlePurchase = async (amount: number, price: number) => {
        try {
            setPurchasing(true)
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credits: amount,
                    price: price
                })
            })

            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error('Failed to initiate checkout')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setPurchasing(false)
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto py-10 px-6">
            <h1 className="text-3xl font-bold tracking-tight mb-8">设置</h1>

            <div className="grid gap-8">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            个人资料
                        </CardTitle>
                        <CardDescription>管理您的账户信息。</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>邮箱</Label>
                            <Input value={userEmail} disabled />
                        </div>
                    </CardContent>
                </Card>



                {/* Credits Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" />
                            积分与账单
                        </CardTitle>
                        <CardDescription>
                            您当前拥有 <span className="font-bold text-primary">{credits !== null ? credits : '--'}</span> 积分。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Card className="border-2 hover:border-primary cursor-pointer transition-all" onClick={() => handlePurchase(100, 10)}>
                                <CardHeader>
                                    <CardTitle className="text-lg">入门版</CardTitle>
                                    <CardDescription>100 积分</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">$10</div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-primary bg-primary/5 cursor-pointer transition-all relative" onClick={() => handlePurchase(500, 40)}>
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl">最受欢迎</div>
                                <CardHeader>
                                    <CardTitle className="text-lg">专业版</CardTitle>
                                    <CardDescription>500 积分</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">$40</div>
                                    <div className="text-sm text-muted-foreground mt-1">节省 20%</div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 hover:border-primary cursor-pointer transition-all" onClick={() => handlePurchase(1000, 70)}>
                                <CardHeader>
                                    <CardTitle className="text-lg">企业版</CardTitle>
                                    <CardDescription>1000 积分</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">$70</div>
                                    <div className="text-sm text-muted-foreground mt-1">节省 30%</div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            积分用于生成 AI 图像（10-20 积分/张）和购买社区项目。
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
