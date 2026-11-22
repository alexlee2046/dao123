import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
    if (process.env.SHADOW_NOINDEX === '1') {
        return { rules: { userAgent: '*', disallow: '/' } }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dao123.com'

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
