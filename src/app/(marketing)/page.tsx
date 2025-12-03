import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Palette, Code2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="px-6 lg:px-10 h-16 flex items-center border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
                <Link className="flex items-center justify-center gap-2" href="/">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Code2 className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">dao123</span>
                </Link>
                <nav className="ml-auto flex gap-6 sm:gap-8">
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
                        功能特性
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">
                        价格
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors" href="/dashboard">
                        登录
                    </Link>
                </nav>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full py-20 md:py-32 lg:py-48 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="flex flex-col items-center space-y-8 text-center">
                            <div className="space-y-4 max-w-3xl">
                                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-4">
                                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                                    AI 驱动的下一代建站工具
                                </div>
                                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                                    用对话构建<br />
                                    <span className="text-primary">完美的网站</span>
                                </h1>
                                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed">
                                    无需编写代码，只需描述您的想法，AI 将为您生成专业的网站。
                                    实时预览，即刻发布。
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 min-w-[300px]">
                                <Button asChild size="lg" className="rounded-full px-8 text-lg h-12 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                                    <Link href="/dashboard">
                                        立即开始 <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="rounded-full px-8 text-lg h-12 border-primary/20 hover:bg-primary/5">
                                    查看演示
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="w-full py-20 bg-muted/30 border-y border-border/50">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">为什么选择 dao123？</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                我们结合了最先进的 AI 模型和现代化的开发框架，为您提供极致的建站体验。
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">极速生成</h3>
                                <p className="text-muted-foreground">
                                    几秒钟内生成完整的落地页、个人博客或企业官网。
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                                    <Palette className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">精美设计</h3>
                                <p className="text-muted-foreground">
                                    自动应用现代化的设计规范，确保您的网站在任何设备上都完美呈现。
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
                                    <Code2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">代码导出</h3>
                                <p className="text-muted-foreground">
                                    生成的代码完全属于您。支持导出 React/Tailwind 代码，随意二次开发。
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full py-20">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6 relative z-10">
                                准备好开始了吗？
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 relative z-10">
                                加入数千名创作者的行列，使用 AI 释放您的创造力。
                            </p>
                            <Button asChild size="lg" className="rounded-full px-8 text-lg h-12 shadow-xl shadow-primary/20 relative z-10">
                                <Link href="/dashboard">免费试用</Link>
                            </Button>

                            <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground relative z-10">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" /> 无需信用卡
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" /> 免费导出代码
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary" /> 7x24小时支持
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 border-t border-border/40 bg-muted/20">
                <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2025 dao123 Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">
                            隐私政策
                        </Link>
                        <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">
                            服务条款
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
