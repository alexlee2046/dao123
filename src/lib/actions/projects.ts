'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ApiBusinessError, ErrorCodes } from '@/lib/api-error'

// 类型定义
export interface Project {
    id: string;
    name: string;
    description?: string;
    user_id: string;
    content: ProjectContent;
    content_json?: Record<string, unknown>;
    is_public: boolean;
    preview_image?: string;
    subdomain?: string;
    deployment_status?: 'pending' | 'deployed' | 'failed';
    created_at: string;
    updated_at: string;
}

export interface ProjectContent {
    html?: string;
    pages?: Array<{
        path: string;
        content: string;
        content_json?: string;
    }>;
}

export interface UpdateProjectData {
    html?: string;
    pages?: Array<{
        path: string;
        content: string;
        content_json?: string;
    }>;
    content_json?: Record<string, unknown>;
}

export interface UpdateProjectMetadata {
    name?: string;
    description?: string;
    preview_image?: string;
}

/**
 * 获取当前用户的所有项目
 */
export async function getUserProjects(): Promise<Project[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as Project[]
}

/**
 * 创建新项目
 */
export async function createProject(name: string, description?: string): Promise<Project> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new ApiBusinessError(ErrorCodes.UNAUTHORIZED)
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            name,
            description,
            user_id: user.id,
            content: {}, // Initial empty content
            content_json: {}, // Initial empty builder content
            is_public: false
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard')
    return data as Project
}

/**
 * 获取单个项目详情
 * @throws ApiBusinessError 如果用户未授权或无权访问
 */
export async function getProject(id: string): Promise<Project> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new ApiBusinessError(ErrorCodes.UNAUTHORIZED)
    }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw new Error(error.message)

    // Basic access control
    if (data.user_id !== user.id) {
        // Check if it's a public project or purchased? 
        // For "Studio" editing, usually only owner can edit.
        // If we support "remixing", that's a different flow (cloning).
        throw new ApiBusinessError(ErrorCodes.FORBIDDEN)
    }

    return data as Project
}

/**
 * 更新项目内容
 */
export async function updateProject(id: string, data: UpdateProjectData): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new ApiBusinessError(ErrorCodes.UNAUTHORIZED)
    }

    const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString()
    }

    // Legacy content (html, pages) goes into 'content' column
    if (data.html !== undefined || data.pages !== undefined) {
        // We need to be careful not to overwrite existing content if only one is passed, 
        // but currently they are passed together. 
        // For safety, let's assume they are passed as the 'content' object structure.
        updatePayload.content = {
            html: data.html,
            pages: data.pages
        }
    }

    // New builder data goes into 'content_json' column
    if (data.content_json !== undefined) {
        updatePayload.content_json = data.content_json
    }

    const { error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    revalidatePath(`/studio/${id}`)
}

/**
 * 更新项目元数据（名称、描述、预览图）
 */
export async function updateProjectMetadata(id: string, data: UpdateProjectMetadata): Promise<void> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new ApiBusinessError(ErrorCodes.UNAUTHORIZED)
    }

    const { error } = await supabase
        .from('projects')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    revalidatePath(`/studio/${id}`)
}
