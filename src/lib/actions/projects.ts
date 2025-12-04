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

    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
        .from('projects')
        .insert({
            name,
            description,
            user_id: user.id,
            content: {}, // Initial empty content
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

    if (!user) throw new Error('Unauthorized')

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
        throw new Error('Forbidden')
    }

    return data
}

export async function updateProject(id: string, content: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('projects')
        .update({
            content,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard')
    revalidatePath(`/studio/${id}`)
}

export async function updateProjectMetadata(id: string, data: { name?: string; description?: string; preview_image?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

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
