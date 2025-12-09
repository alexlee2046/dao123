'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Asset {
    id: string
    url: string
    name: string
    type: string
    user_id: string
    created_at?: string
}

export async function getAssets() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data as Asset[]
}

export async function saveAssetRecord(asset: { url: string; name: string; type: string; size?: number }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('用户未登录')
    }

    const { data, error } = await supabase
        .from('assets')
        .insert({
            user_id: user.id,
            url: asset.url,
            name: asset.name,
            type: asset.type,
        })
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    return data as Asset
}

export async function deleteAsset(id: string, path: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('用户未登录')
    }

    // 1. Delete from Storage
    // Extract path from URL if needed, but here we assume 'path' is passed or we can derive it.
    // Usually the path in storage is just the filename if uploaded to root of bucket.
    // Let's assume the caller passes the correct storage path.

    const { error: storageError } = await supabase
        .storage
        .from('assets')
        .remove([path])

    if (storageError) {
        console.error('Storage delete error:', storageError)
        // We continue to delete from DB even if storage delete fails (orphaned file is better than broken UI)
    }

    // 2. Delete from DB
    const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (dbError) {
        throw new Error(dbError.message)
    }

    revalidatePath('/dashboard')
}

export async function getAsset(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null
    return data as Asset
}
