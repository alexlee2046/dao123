'use server'

import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('projects')
        .select(`
      *,
      user:user_id(email),
      ratings(score)
    `)
        .eq('is_public', true)
        .order('published_at', { ascending: false })

    if (error) throw new Error(error.message)

    // Calculate average rating
    return data.map((project: any) => ({
        ...project,
        averageRating: project.ratings?.length
            ? project.ratings.reduce((a: number, b: { score: number }) => a + b.score, 0) / project.ratings.length
            : 0,
        ratingCount: project.ratings?.length || 0
    }))
}

export async function publishProject(id: string, price: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('projects')
        .update({
            is_public: true,
            price,
            published_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw new Error(error.message)
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
