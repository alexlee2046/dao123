'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Atom, ArrowRight, Sparkles } from "lucide-react"
import Link from 'next/link'
import { motion } from "framer-motion"
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
    const t = useTranslations('auth')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            toast.success(t('loginSuccess'))
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (error) throw error
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    const handleGitHubLogin = async () => {
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (error) throw error
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden">
            {/* Left Side - Visual & Branding */}
            <div className="hidden lg:flex relative flex-col justify-between p-10 bg-zinc-900 text-white overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-900 to-zinc-900 z-0"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                {/* Animated Particles/Orbs */}
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/3 left-1/4 w-2 h-2 bg-blue-400 rounded-full blur-[1px]"
                />
                <motion.div
                    animate={{
                        y: [0, 30, 0],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-purple-400 rounded-full blur-[1px]"
                />

                {/* Logo Area */}
                <div className="relative z-10 flex items-center gap-2 text-lg font-medium">
                    <div className="h-8 w-8 relative flex items-center justify-center">
                        <img src="/logo.svg" alt="Dao123 Logo" className="h-5 w-5" />
                    </div>
                    <span>Dao 123</span>
                </div>

                {/* Quote Area */}
                <div className="relative z-10 max-w-md">
                    <blockquote className="space-y-2">
                        <p className="text-2xl font-medium leading-relaxed tracking-tight">
                            &ldquo;{t('quote')}&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400 mt-4">
                            {t('quoteAuthor')}
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center p-8 bg-background relative">
                <div className="absolute top-4 right-4 lg:top-8 lg:right-8 flex items-center gap-4">
                    <Suspense fallback={<div className="w-[140px]" />}>
                        <LanguageSwitcher />
                    </Suspense>
                    <Link href="/signup" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        {t('signupButton')}
                    </Link>
                </div>

                <div className="mx-auto w-full max-w-[350px] space-y-8">
                    <div className="flex flex-col space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight">{t('welcomeBack')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {t('enterEmailDesc')}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-11 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t('password')}</Label>
                                <Link href="#" className="text-xs text-primary hover:underline">
                                    {t('forgotPassword')}
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-all"
                            />
                        </div>

                        <Button className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" type="submit" disabled={loading}>
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    {t('loginButton')} <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                {t('or')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="h-10 bg-background hover:bg-accent hover:text-accent-foreground border-input"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            className="h-10 bg-background hover:bg-accent hover:text-accent-foreground border-input"
                            onClick={handleGitHubLogin}
                            disabled={loading}
                        >
                            <svg className="mr-2 h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                            </svg>
                            GitHub
                        </Button>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        {t('termsDesc')}{" "}
                        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                            {t('terms')}
                        </Link>{" "}
                        {t('and')}{" "}
                        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                            {t('privacy')}
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
