import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

// 创建 next-intl 中间件
const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always' // 总是在 URL 中显示语言前缀，对 SEO 友好
})

export async function middleware(request: NextRequest) {
    // Skip middleware for API routes - let them handle auth themselves
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // 处理 i18n 路由
    const intlResponse = intlMiddleware(request)

    // 如果 intl 中间件返回了重定向，直接返回
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

    // 提取 locale 前缀后的路径
    const pathnameWithoutLocale = request.nextUrl.pathname.replace(/^\/(en|zh)/, '')

    // Protected routes pattern
    const protectedPaths = ['/studio', '/dashboard', '/admin', '/generate', '/settings', '/community']
    const isProtected = protectedPaths.some(path => pathnameWithoutLocale.startsWith(path))

    // Auth routes (login/signup)
    const isAuthRoute = pathnameWithoutLocale.startsWith('/login') || pathnameWithoutLocale.startsWith('/signup')

    // 获取当前语言
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
