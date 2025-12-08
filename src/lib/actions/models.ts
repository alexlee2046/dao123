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
