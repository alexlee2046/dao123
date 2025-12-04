'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getUserProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function createProject(name: string, description?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('未授权')

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
    return data
}

export async function getProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('未授权')

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
        throw new Error('禁止访问')
    }

    return data
}

export async function updateProject(id: string, data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('未授权')

    const updatePayload: any = {
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

export async function updateProjectMetadata(id: string, data: { name?: string; description?: string; preview_image?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('未授权')

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
