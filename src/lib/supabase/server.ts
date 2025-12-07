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

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
