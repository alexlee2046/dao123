'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface ModelInput {
    id: string
    name: string
    provider: string
    type: 'chat' | 'image' | 'video'
    enabled: boolean
    is_free: boolean
    cost_per_unit?: number // Credits per usage (optional for create, defaults to 1)
}

/**
 * 获取所有模型 (管理员专用)
 */
export async function getAllModels() {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('provider', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching all models:', error)
        throw error
    }

    return data
}

/**
 * 创建新模型
 */
export async function createModel(model: ModelInput) {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    const { data, error } = await adminSupabase
        .from('models')
        .insert(model)
        .select()
        .single()

    if (error) {
        console.error('Error creating model:', error)
        throw error
    }

    return data
}

/**
 * 更新模型
 */
export async function updateModel(id: string, updates: Partial<ModelInput>) {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    const { data, error } = await adminSupabase
        .from('models')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating model:', error)
        throw error
    }

    return data
}

/**
 * 删除模型
 */
export async function deleteModel(id: string) {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    const { error } = await adminSupabase
        .from('models')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting model:', error)
        throw error
    }

    return { success: true }
}

/**
 * 批量导入模型 (从OpenRouter等平台)
 */
export async function bulkImportModels(models: ModelInput[]) {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        throw new Error('Forbidden: Admin access required')
    }

    const { data, error } = await adminSupabase
        .from('models')
        .upsert(models, { onConflict: 'id' })
        .select()

    if (error) {
        console.error('Error bulk importing models:', error)
        throw error
    }

    return data
}
