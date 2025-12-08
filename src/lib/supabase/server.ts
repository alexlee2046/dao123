import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

export function createAdminClient() {
    const { createClient } = require('@supabase/supabase-js')

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Use service role key if available, otherwise fall back to anon key
    const key = serviceRoleKey || anonKey

    if (!key) {
        console.error('[createAdminClient] No Supabase key available!')
        throw new Error('Supabase key not configured')
    }

    if (!serviceRoleKey) {
        console.warn('[createAdminClient] Service role key not found, using anon key as fallback')
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        key,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

/**
 * Create an anonymous Supabase client for reading public data
 * This client doesn't use cookies and works for unauthenticated requests
 */
export function createAnonClient() {
    const { createClient } = require('@supabase/supabase-js')

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('[createAnonClient] URL exists:', !!url)
    console.log('[createAnonClient] Key exists:', !!key)

    if (!url || !key) {
        console.warn('[createAnonClient] Missing Supabase configuration! Using placeholders to prevent build crash.', { url: !!url, key: !!key })
    }

    // Use placeholders if missing to allow build to proceed (requests will fail gracefully)
    const validUrl = url || 'https://placeholder.supabase.co'
    const validKey = key || 'placeholder-key'

    return createClient(
        validUrl,
        validKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
