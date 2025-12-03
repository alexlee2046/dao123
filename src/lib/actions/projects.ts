'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProjectData {
    id?: string
    name: string
    description?: string
    content: any
    is_public?: boolean
}

export async function saveProject(project: ProjectData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const projectToSave = {
        user_id: user.id,
        name: project.name,
        description: project.description,
        content: project.content,
        is_public: project.is_public ?? false,
        updated_at: new Date().toISOString(),
    }

    let result;
    if (project.id) {
        // Update existing
        result = await supabase
            .from('projects')
            .update(projectToSave)
            .eq('id', project.id)
            .select()
            .single()
    } else {
        // Insert new
        result = await supabase
            .from('projects')
            .insert(projectToSave)
            .select()
            .single()
    }

    if (result.error) {
        throw new Error(result.error.message)
    }

    revalidatePath('/dashboard')
    return result.data
}

export async function getProjects() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function getProject(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function deleteProject(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
}

export async function getSharedProjects() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select('*, users:user_id(email)') // Assuming we want to show who shared it, if users table is accessible. 
        // Note: auth.users is not directly joinable usually unless we have a public profile table. 
        // For now, just get projects.
        .eq('is_public', true)
        .order('updated_at', { ascending: false })

    if (error) {
        throw new Error(error.message)
    }

    return data
}
