'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Palette, Code2, ArrowRight, CheckCircle2, Infinity as InfinityIcon, Layers, Share2 } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from 'react';

export default function LandingPage() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
    const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
            {/* Header */}
            <header className="px-6 lg:px-10 h-16 flex items-center border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
                <Link className="flex items-center justify-center gap-2 group" href="/">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Code2 className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">dao123</span>
                </Link>
                <nav className="ml-auto flex gap-6 sm:gap-8 items-center">
                    <Link className="text-sm font-medium hover:text-primary transition-colors hidden sm:block" href="#philosophy">
                        理念
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors hidden sm:block" href="#features">
                        功能
                    </Link>
                    <Link className="text-sm font-medium hover:text-primary transition-colors hidden sm:block" href="#pricing">
                        价格
                    </Link>
                    <Button asChild variant="default" size="sm" className="rounded-full px-6">
                        <Link href="/dashboard">
                            登录 / 注册
                        </Link>
                    </Button>
                </nav>
            </header>

            <main className="flex-1">
                {/* Hero Section: Dao begets One */}
                <section ref={targetRef} className="w-full min-h-[90vh] flex items-center justify-center relative overflow-hidden py-20">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>

                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"
                        />
                    </div>

                    <motion.div
                        style={{ opacity, scale, y }}
                        className="container px-4 md:px-6 mx-auto relative z-10"
                    >
                        <div className="flex flex-col items-center space-y-8 text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm mb-4"
                            >
                                <Sparkles className="mr-2 h-3.5 w-3.5" />
                                道生一 · AI 驱动万物
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50"
                            >
                                道生一<br />
                                <span className="text-primary">一生万物</span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                                className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed"
                            >
                                从一个简单的想法开始，AI 助您衍生出无限可能。
                                <br className="hidden md:block" />
                                构建网站、生成应用、创造价值，一切始于此。
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                                className="flex flex-col sm:flex-row gap-4 min-w-[300px]"
                            >
                                <Button asChild size="lg" className="rounded-full px-8 text-lg h-14 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
                                    <Link href="/dashboard">
                                        立即开始创造 <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="rounded-full px-8 text-lg h-14 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                                    探索社区作品
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </section>

                {/* Philosophy Section: 1 -> 2 -> 3 -> All */}
                <section id="philosophy" className="w-full py-24 bg-muted/10 relative">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid gap-16 lg:grid-cols-3 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden lg:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0"></div>

                            {/* Step 1: Dao begets One */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col items-center text-center relative z-10"
                            >
                                <div className="h-24 w-24 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Zap className="h-8 w-8" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">道生一</h3>
                                <p className="text-muted-foreground max-w-xs">
                                    您的一个灵感 (Idea)。
                                    <br />
                                    只需一句描述，AI 核心即刻启动。
                                </p>
                            </motion.div>

                            {/* Step 2: One begets Two */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col items-center text-center relative z-10"
                            >
                                <div className="h-24 w-24 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <Layers className="h-8 w-8" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">一生二</h3>
                                <p className="text-muted-foreground max-w-xs">
                                    人机协作 (Interaction)。
                                    <br />
                                    您与 AI 的每一次对话，都在完善细节。
                                </p>
                            </motion.div>

                            {/* Step 3: Two begets Three */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col items-center text-center relative z-10"
                            >
                                <div className="h-24 w-24 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center mb-6 shadow-xl shadow-primary/5">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <InfinityIcon className="h-8 w-8" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-3">三生万物</h3>
                                <p className="text-muted-foreground max-w-xs">
                                    无限生成 (Generation)。
                                    <br />
                                    网站、应用、代码，即刻呈现，生生不息。
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="w-full py-24">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">为什么选择 dao123？</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                我们结合了最先进的 AI 模型和现代化的开发框架，为您提供极致的建站体验。
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="flex flex-col items-start p-8 rounded-3xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                            >
                                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">极速生成</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    几秒钟内生成完整的落地页、个人博客或企业官网。无需等待，即刻预览。
                                </p>
                            </motion.div>
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="flex flex-col items-start p-8 rounded-3xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                            >
                                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6">
                                    <Palette className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">精美设计</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    自动应用现代化的设计规范，确保您的网站在任何设备上都完美呈现。
                                </p>
                            </motion.div>
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="flex flex-col items-start p-8 rounded-3xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                            >
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                                    <Code2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">代码导出</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    生成的代码完全属于您。支持导出 React/Tailwind 代码，随意二次开发。
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Community/Showcase Section */}
                <section className="w-full py-24 bg-background border-t border-border/40">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">社区精选</h2>
                                <p className="text-muted-foreground text-lg max-w-xl">
                                    看看其他人使用 dao123 创造了什么。
                                </p>
                            </div>
                            <Button variant="outline" className="rounded-full">
                                查看更多 <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Placeholders for community items - in a real app these would be dynamic */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="group relative aspect-video rounded-2xl overflow-hidden bg-muted">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                        <div className="text-white">
                                            <h4 className="font-bold text-lg">项目 {i}</h4>
                                            <p className="text-sm text-white/80">由用户创建</p>
                                        </div>
                                    </div>
                                    {/* Placeholder visual */}
                                    <div className="w-full h-full bg-muted-foreground/10 flex items-center justify-center text-muted-foreground/30">
                                        <Sparkles className="h-12 w-12" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full py-24 relative overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-primary/5"></div>
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="bg-background/50 backdrop-blur-xl border border-primary/10 rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

                            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 relative z-10">
                                准备好开始了吗？
                            </h2>
                            <p className="text-muted-foreground text-xl max-w-2xl mx-auto mb-10 relative z-10">
                                加入数千名创作者的行列，使用 AI 释放您的创造力。
                            </p>

                            <Button asChild size="lg" className="rounded-full px-10 text-lg h-16 shadow-xl shadow-primary/20 relative z-10 hover:scale-105 transition-transform">
                                <Link href="/dashboard">免费试用</Link>
                            </Button>

                            <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground relative z-10">
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

            <footer className="py-12 border-t border-border/40 bg-background">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        <div className="md:col-span-2">
                            <Link className="flex items-center gap-2 mb-4" href="/">
                                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                                    <Code2 className="h-5 w-5" />
                                </div>
                                <span className="font-bold text-xl tracking-tight">dao123</span>
                            </Link>
                            <p className="text-muted-foreground max-w-xs">
                                道生一，一生二，二生三，三生万物。
                                <br />
                                用 AI 重新定义网站构建。
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">产品</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="#" className="hover:text-foreground">功能特性</Link></li>
                                <li><Link href="#" className="hover:text-foreground">价格方案</Link></li>
                                <li><Link href="#" className="hover:text-foreground">更新日志</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">公司</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="#" className="hover:text-foreground">关于我们</Link></li>
                                <li><Link href="#" className="hover:text-foreground">隐私政策</Link></li>
                                <li><Link href="#" className="hover:text-foreground">服务条款</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-border/40">
                        <p className="text-sm text-muted-foreground">
                            © 2025 dao123 Inc. 保留所有权利。
                        </p>
                        <div className="flex gap-4">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
