'use server'

import { createClient, createAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Comment {
    id: string
    user_id: string
    content: string
    created_at: string
    user?: {
        email: string
    }
}

export interface Rating {
    id: string
    user_id: string
    score: number
    review?: string
    created_at: string
}

export async function getCommunityProjects() {
    // Use anon client for reading public data (no cookies needed)
    const supabase = createAnonClient()

    try {
        // Simple query without joins - anon client can't join auth tables
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('is_public', true)
            .order('published_at', { ascending: false })

        console.log('[getCommunityProjects] Query result:', {
            count: data?.length || 0,
            error: error?.message,
            firstProject: data?.[0]?.name
        });

        if (error) {
            console.error("Supabase error fetching community projects:", error);
            throw new Error(error.message)
        }

        if (!data) return [];

        // Return projects with default values for rating/user info
        return data.map((project: any) => ({
            ...project,
            user: { email: 'anonymous@dao123.me' },
            averageRating: 0,
            ratingCount: 0
        }));
    } catch (e) {
        console.error("Failed to get community projects:", e);
        return [];
    }
}

/**
 * Get featured community projects for homepage display
 * Returns the latest 3 public projects that have a preview image
 */
export async function getFeaturedCommunityProjects(limit: number = 3) {
    try {
        // Use anon client for reading public data (no cookies needed)
        const supabase = createAnonClient()

        // Simple query without joins - anon client can't join auth tables
        const { data, error } = await supabase
            .from('projects')
            .select('id, name, description, preview_image, published_at')
            .eq('is_public', true)
            .not('preview_image', 'is', null)
            .neq('preview_image', '')
            .order('published_at', { ascending: false })
            .limit(limit)

        console.log('[getFeaturedCommunityProjects] Query result:', {
            count: data?.length || 0,
            error: error?.message,
        });

        if (error) {
            console.error("Supabase error fetching featured projects:", error);
            return [];
        }

        if (!data) return [];

        // Map with default user info
        return data.map((project: any) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            preview_image: project.preview_image,
            user: { email: 'creator@dao123.me' },
        }));
    } catch (e) {
        console.error("Failed to get featured projects:", e);
        return [];
    }
}

export async function publishProject(id: string, price: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    console.log('[publishProject] Publishing project:', { id, price, userId: user.id });

    const { data, error } = await supabase
        .from('projects')
        .update({
            is_public: true,
            price,
            published_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()

    console.log('[publishProject] Update result:', {
        success: !error,
        updatedRows: data?.length || 0,
        error: error?.message
    });

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) {
        throw new Error('Project not found or you do not have permission to publish it')
    }

    revalidatePath('/community')
}

export async function purchaseProject(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase.rpc('process_project_purchase', {
        p_project_id: projectId,
        p_buyer_id: user.id
    })

    if (error) throw new Error(error.message)
    revalidatePath('/community')
    revalidatePath('/dashboard')
}

export async function addComment(projectId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('comments')
        .insert({
            project_id: projectId,
            user_id: user.id,
            content
        })

    if (error) throw new Error(error.message)
    revalidatePath(`/community/${projectId}`)
}

export async function getComments(projectId: string) {
    const supabase = await createClient()

    // We need to join with profiles or users to get names, but auth.users is not directly joinable usually.
    // However, we created a profiles table earlier which is public.
    // Let's assume we can get email from auth.users if we use a view or just fetch profiles.
    // For now, let's just fetch comments and we might need to fetch user details separately or if we have a public profile table.
    // Wait, I created public.profiles but it only has email and credits.
    // Let's try to join with profiles if possible, or just return user_id.

    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function addRating(projectId: string, score: number, review?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('ratings')
        .upsert({
            project_id: projectId,
            user_id: user.id,
            score,
            review
        }, { onConflict: 'project_id,user_id' })

    if (error) throw new Error(error.message)
    revalidatePath(`/community/${projectId}`)
}

export async function checkAccess(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // Check if owner
    const { data: project } = await supabase
        .from('projects')
        .select('user_id, price')
        .eq('id', projectId)
        .single()

    if (project?.user_id === user.id) return true
    if (project?.price === 0) return true // Free projects are accessible

    // Check if purchased
    const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('project_id', projectId)
        .eq('buyer_id', user.id)
        .single()

    return !!purchase
}
