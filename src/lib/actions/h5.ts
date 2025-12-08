'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface H5Template {
    id: string
    name: string
    description: string | null
    category: 'wedding' | 'birthday' | 'business' | 'holiday' | 'other'
    thumbnail: string | null
    content: any
    h5_config: H5Config
    is_premium: boolean
    price: number
    created_at: string
}

export interface H5Config {
    music_url?: string
    page_effect?: 'slide' | 'fade' | 'flip'
    auto_play?: boolean
    show_page_indicator?: boolean
}

export interface H5Project {
    id: string
    name: string
    description: string | null
    content: any
    h5_config: H5Config
    preview_image: string | null
    subdomain: string | null
    is_public: boolean
    created_at: string
    updated_at: string
}

/**
 * 获取所有 H5 模板
 */
export async function getH5Templates(category?: string): Promise<H5Template[]> {
    const supabase = await createClient()

    let query = supabase
        .from('h5_templates')
        .select('*')
        .order('created_at', { ascending: false })

    if (category && category !== 'all') {
        query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching H5 templates:', error)
        return []
    }

    return data || []
}

/**
 * 获取单个 H5 模板
 */
export async function getH5Template(id: string): Promise<H5Template | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('h5_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching H5 template:', error)
        return null
    }

    return data
}

/**
 * 获取用户的 H5 项目
 */
export async function getUserH5Projects(): Promise<H5Project[]> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_type', 'h5')
        .order('updated_at', { ascending: false })

    if (error) {
        console.error('Error fetching H5 projects:', error)
        return []
    }

    return data || []
}

/**
 * 创建 H5 项目（从模板或空白）
 */
export async function createH5Project(params: {
    name: string
    templateId?: string
    content?: any
    h5_config?: H5Config
}): Promise<{ id: string } | null> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未授权')

    let content = params.content || { pages: [] }
    let h5_config: H5Config = params.h5_config || { page_effect: 'slide' }

    // 如果使用模板
    if (params.templateId) {
        const template = await getH5Template(params.templateId)
        if (template) {
            content = template.content
            h5_config = template.h5_config
        }
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            name: params.name,
            user_id: user.id,
            project_type: 'h5',
            content,
            h5_config
        })
        .select('id')
        .single()

    if (error) {
        console.error('Error creating H5 project:', error)
        throw new Error(error.message)
    }

    revalidatePath('/h5')
    return data
}

/**
 * 获取单个 H5 项目
 */
export async function getH5Project(id: string): Promise<H5Project | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('project_type', 'h5')
        .single()

    if (error) {
        console.error('Error fetching H5 project:', error)
        return null
    }

    return data
}

/**
 * 获取公开的 H5 项目（用于分享页面）
 */
export async function getPublicH5Project(id: string): Promise<H5Project | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('project_type', 'h5')
        .single()

    if (error) {
        console.error('Error fetching public H5 project:', error)
        return null
    }

    return data
}

/**
 * 更新 H5 项目
 */
export async function updateH5Project(id: string, updates: {
    name?: string
    content?: any
    h5_config?: H5Config
    preview_image?: string
}): Promise<void> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未授权')

    const { error } = await supabase
        .from('projects')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating H5 project:', error)
        throw new Error(error.message)
    }

    revalidatePath('/h5')
    revalidatePath(`/h5/${id}`)
}

/**
 * 删除 H5 项目
 */
export async function deleteH5Project(id: string): Promise<void> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未授权')

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('project_type', 'h5')

    if (error) {
        console.error('Error deleting H5 project:', error)
        throw new Error(error.message)
    }

    revalidatePath('/h5')
}

/**
 * 发布 H5 项目
 */
export async function publishH5Project(id: string): Promise<{ url: string }> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未授权')

    const { error } = await supabase
        .from('projects')
        .update({
            is_public: true,
            published_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error publishing H5 project:', error)
        throw new Error(error.message)
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006'
    return { url: `${baseUrl}/h5/view/${id}` }
}
