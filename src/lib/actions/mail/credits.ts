'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function getMailCredits() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 0

    const { data } = await supabase
        .from('profiles')
        .select('mail_credits')
        .eq('id', user.id)
        .single()

    return data?.mail_credits || 0
}

export async function deductMailCredits(amount: number, description: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Use Admin Client for secure operations
    const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current credits
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('mail_credits')
        .eq('id', user.id)
        .single()

    if (!profile || (profile.mail_credits || 0) < amount) {
        throw new Error('Insufficient mail credits')
    }

    // Deduct credits
    const { error: updateError } = await adminSupabase
        .from('profiles')
        .update({ mail_credits: (profile.mail_credits || 0) - amount })
        .eq('id', user.id)

    if (updateError) throw new Error(updateError.message)

    // Record transaction
    await adminSupabase.from('transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'mail_unlock',
        description
    })

    revalidatePath('/mail')
    return (profile.mail_credits || 0) - amount
}
