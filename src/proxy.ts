import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

// Create next-intl middleware
const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always' // Always show locale prefix in URL, SEO friendly
})

export default async function proxy(request: NextRequest) {
    // Skip middleware for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // Subdomain Handling
    const hostname = request.headers.get('host') || ''
    // Allow overriding base domain via env, default to dao123.me
    // In local dev (localhost:3000), we might need to simulate.
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dao123.me'

    let subdomain: string | null = null

    // simple check: does hostname end with .baseDomain?
    // Note: localhost handling is tricky. 
    // Standard approach: app.dao123.me vs dao123.me

    const isVercelDomain = hostname.includes('.vercel.app')
    const domainParts = hostname.split('.')

    if (hostname.includes('localhost')) {
        // test.localhost:3000
        if (domainParts.length > 1 && domainParts[0] !== 'www') {
            subdomain = domainParts[0]
        }
    } else if (isVercelDomain) {
        // project-name.vercel.app -> subdomain is project-name? 
        // No, Vercel assigns project name. 
        // If we use wildcard on Vercel, it appears as subdomain.dao123.me
        // If user accesses directly via Vercel URL, we might want to treat it as main app or subdomain?
        // Let's rely on custom domain logic mostly.
        if (hostname.endsWith(`.${baseDomain}`)) {
            const sub = hostname.replace(`.${baseDomain}`, '')
            if (sub !== 'www') {
                subdomain = sub
            }
        }
    } else {
        // Production Custom Domain
        if (hostname.endsWith(`.${baseDomain}`)) {
            const sub = hostname.replace(`.${baseDomain}`, '')
            if (sub !== 'www') {
                subdomain = sub
            }
        }
    }

    // If we detected a valid subdomain (and it's not a reserved one like 'app' if we had one), rewrite
    if (subdomain) {
        // Rewrite request to /site/[subdomain]
        // e.g. alex.dao123.me/foo -> /site/alex/foo
        const url = request.nextUrl.clone()
        url.pathname = `/site/${subdomain}${request.nextUrl.pathname}`
        return NextResponse.rewrite(url)
    }

    // --- Standard App Routing (i18n + Auth) ---

    // Handle i18n routing
    const intlResponse = intlMiddleware(request)

    // If intl middleware returned a redirect, return it immediately
    if (intlResponse.status === 307 || intlResponse.status === 308) {
        return intlResponse
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Extract path after locale prefix
    const pathnameWithoutLocale = request.nextUrl.pathname.replace(/^\/(en|zh)/, '')

    // Protected routes pattern
    const protectedPaths = ['/studio', '/dashboard', '/admin', '/generate', '/settings', '/community']
    const isProtected = protectedPaths.some(path => pathnameWithoutLocale.startsWith(path))

    // Auth routes (login/signup)
    const isAuthRoute = pathnameWithoutLocale.startsWith('/login') || pathnameWithoutLocale.startsWith('/signup')

    // Get current locale
    const locale = request.nextUrl.pathname.split('/')[1] || defaultLocale

    if (isProtected && !user) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }

    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
