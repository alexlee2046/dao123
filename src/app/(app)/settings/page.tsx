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
            <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

            <div className="grid gap-8">
                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>Manage your account information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={userEmail} disabled />
                        </div>
                    </CardContent>
                </Card>



                {/* Credits Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Coins className="h-5 w-5" />
                            Credits & Billing
                        </CardTitle>
                        <CardDescription>
                            You have <span className="font-bold text-primary">{credits !== null ? credits : '--'}</span> credits available.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Card className="border-2 hover:border-primary cursor-pointer transition-all" onClick={() => handlePurchase(100, 10)}>
                                <CardHeader>
                                    <CardTitle className="text-lg">Starter</CardTitle>
                                    <CardDescription>100 Credits</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">$10</div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-primary bg-primary/5 cursor-pointer transition-all relative" onClick={() => handlePurchase(500, 40)}>
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl">Popular</div>
                                <CardHeader>
                                    <CardTitle className="text-lg">Pro</CardTitle>
                                    <CardDescription>500 Credits</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">$40</div>
                                    <div className="text-sm text-muted-foreground mt-1">Save 20%</div>
                                </CardContent>
                            </Card>

                            <Card className="border-2 hover:border-primary cursor-pointer transition-all" onClick={() => handlePurchase(1000, 70)}>
                                <CardHeader>
                                    <CardTitle className="text-lg">Enterprise</CardTitle>
                                    <CardDescription>1000 Credits</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">$70</div>
                                    <div className="text-sm text-muted-foreground mt-1">Save 30%</div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-xs text-muted-foreground">
                            Credits are used for generating AI images (10-20 credits/image) and purchasing community projects.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
