import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Added Inter import
import "../globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils"; // Added cn utility

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const messages = await getMessages({ locale });

    const title = (messages as any).metadata?.title || "dao123 - AI Website Builder";
    const description = (messages as any).metadata?.description || "Generate AI-powered websites in seconds.";

    return {
        title,
        description,
        keywords: locale === 'zh'
            ? ['AI网站', '网站生成器', '邮件营销', '落地页', '表单收集', '中小企业']
            : ['AI website', 'website builder', 'email marketing', 'landing page', 'lead capture', 'SMB'],
        authors: [{ name: 'dao123' }],
        creator: 'dao123',
        publisher: 'dao123',
        robots: {
            index: true,
            follow: true,
        },
        openGraph: {
            type: 'website',
            locale: locale === 'zh' ? 'zh_CN' : 'en_US',
            url: 'https://www.dao123.me',
            siteName: 'dao123',
            title,
            description,
            images: [
                {
                    url: '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: 'dao123 - AI Website Builder',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/og-image.png'],
        },
        metadataBase: new URL('https://www.dao123.me'),
    };
}

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // 验证 locale
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // 获取翻译消息
    const messages = await getMessages({ locale });

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={cn("font-sans antialiased", inter.variable)}>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <div className="fixed top-3 right-3 z-50">
                            <ModeToggle />
                        </div>
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
