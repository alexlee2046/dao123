'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to check admin status
// Helper to check admin status
async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('未授权')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('禁止访问：需要管理员权限')
    }

    return supabase
}

export async function getSystemSettings() {
    const supabase = await requireAdmin()

    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key')

    if (error) throw new Error(error.message)
    return data
}

export async function updateSystemSetting(key: string, value: string) {
    const supabase = await requireAdmin()

    const { error } = await supabase
        .from('system_settings')
        .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
        })

    if (error) throw new Error(error.message)
    revalidatePath('/admin/settings')
}

export async function getUsers() {
    const supabase = await requireAdmin()

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function updateUserCredits(userId: string, credits: number) {
    const supabase = await requireAdmin()

    const { error } = await supabase
        .from('profiles')
        .update({ credits })
        .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/users')
}

export async function getAdminStats() {
    const supabase = await requireAdmin()

    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: projectsCount } = await supabase.from('projects').select('*', { count: 'exact', head: true })
    const { count: assetsCount } = await supabase.from('assets').select('*', { count: 'exact', head: true })

    // Calculate total revenue/credits consumed (simplified)
    const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'purchase') // Assuming 'purchase' is credit purchase or consumption

    const totalCredits = transactions?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

    return {
        usersCount,
        projectsCount,
        assetsCount,
        totalCredits
    }
}

export async function getAdminChartData() {
    const supabase = await requireAdmin()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDate = thirtyDaysAgo.toISOString()

    // Fetch users created in last 30 days
    const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate)

    // Fetch transactions in last 30 days
    const { data: transactions } = await supabase
        .from('transactions')
        .select('created_at, amount, type')
        .gte('created_at', startDate)

    // Aggregate data
    const chartData = []
    const dateMap = new Map()

    // Initialize map with last 30 days
    for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        dateMap.set(dateStr, {
            date: dateStr,
            newUsers: 0,
            revenue: 0, // Credits purchased
            consumption: 0 // Credits used (negative amount)
        })
    }

    // Fill user data
    users?.forEach(user => {
        const dateStr = new Date(user.created_at).toISOString().split('T')[0]
        if (dateMap.has(dateStr)) {
            const entry = dateMap.get(dateStr)
            entry.newUsers += 1
        }
    })

    // Fill transaction data
    transactions?.forEach(tx => {
        const dateStr = new Date(tx.created_at).toISOString().split('T')[0]
        if (dateMap.has(dateStr)) {
            const entry = dateMap.get(dateStr)
            if (tx.amount > 0) {
                entry.revenue += tx.amount
            } else {
                entry.consumption += Math.abs(tx.amount)
            }
        }
    })

    // Convert map to sorted array
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export async function getAllAssets() {
    const supabase = await requireAdmin()

    const { data, error } = await supabase
        .from('assets')
        .select('*, user:user_id(email)')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function adminDeleteAsset(id: string, url: string) {
    const supabase = await requireAdmin()

    // 1. Delete from Storage
    // URL format: .../storage/v1/object/public/assets/USER_ID/FILENAME
    const urlParts = url.split('/assets/')
    if (urlParts.length > 1) {
        const storagePath = urlParts[1]
        await supabase.storage.from('assets').remove([storagePath])
    }

    // 2. Delete from DB
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/assets')
}
