'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCredits() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

    return data?.credits || 0
}

export async function deductCredits(amount: number, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Get current credits
    const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

    if (!profile || profile.credits < amount) {
        throw new Error('Insufficient credits')
    }

    // Deduct credits
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - amount })
        .eq('id', user.id)

    if (updateError) throw new Error(updateError.message)

    // Record transaction
    await supabase.from('transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'usage',
        description
    })

    revalidatePath('/dashboard')
    return profile.credits - amount
}

export async function addCredits(amount: number, type: string, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

    const currentCredits = profile?.credits || 0

    await supabase
        .from('profiles')
        .update({ credits: currentCredits + amount })
        .eq('id', user.id)

    await supabase.from('transactions').insert({
        user_id: user.id,
        amount: amount,
        type,
        description
    })

    revalidatePath('/dashboard')
}
