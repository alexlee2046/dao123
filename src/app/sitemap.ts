import { MetadataRoute } from 'next'
import { locales } from '@/i18n'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dao123.com'

    // 需要包含在 sitemap 中的路由
    const routes = [
        '',
        '/dashboard',
        '/community',
        '/studio',
        '/login',
        '/signup',
    ]

    // 为每个路由生成所有语言版本
    const sitemap: MetadataRoute.Sitemap = []

    routes.forEach((route) => {
        locales.forEach((locale) => {
            sitemap.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: route === '' ? 1.0 : 0.8,
                alternates: {
                    languages: Object.fromEntries(
                        locales.map((l) => [l, `${baseUrl}/${l}${route}`])
                    ),
                },
            })
        })
    })

    return sitemap
}
