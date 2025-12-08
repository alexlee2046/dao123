'use server'

import { createClient } from '@/lib/supabase/server'

export interface Model {
    id: string
    name: string
    provider: string
    enabled: boolean
    is_free: boolean
    cost_per_unit: number // Usage cost in credits
    type: 'chat' | 'image' | 'video'
}

export async function getModels(type: 'chat' | 'image' | 'video' = 'chat') {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('enabled', true)
        .eq('type', type)
        // Order by cost (cheapest first) then provider
        .order('cost_per_unit', { ascending: true })
        .order('provider', { ascending: true })

    if (error) {
        console.error('Error fetching models:', error)
        return []
    }

    return data as Model[]
}

/**
 * 根据 ID 获取单个模型配置
 */
export async function getModelById(modelId: string): Promise<Model | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .eq('enabled', true)
        .single()

    if (error) {
        console.error('Error fetching model by id:', error)
        return null
    }

    return data
}

/**
 * 获取指定类型的默认模型（第一个启用且成本最低的模型）
 */
export async function getDefaultModel(type: 'chat' | 'image' | 'video'): Promise<Model | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('type', type)
        .eq('enabled', true)
        .order('cost_per_unit', { ascending: true })
        .limit(1)
        .single()

    if (error) {
        console.error('Error fetching default model:', error)
        return null
    }

    return data
}
