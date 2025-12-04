'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Sparkles, Infinity, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

interface Project {
    id: string;
    name: string;
    description?: string;
    price: number;
    user?: {
        email?: string;
    };
    averageRating: number;
    ratingCount: number;
}

interface CommunityViewProps {
    projects: Project[];
}

export function CommunityView({ projects }: CommunityViewProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-12 px-6 md:px-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center text-center mb-16 space-y-4"
            >
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                    <Infinity className="mr-2 h-3 w-3" />
                    三生万物 · 无限可能
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                    灵感广场
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    探索社区成员创造的无限可能。每一个项目都是一颗独特的种子。
                </p>

                <div className="w-full max-w-md relative mt-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索灵感..."
                        className="pl-10 h-12 rounded-full bg-muted/50 border-border/50 focus:ring-primary/20"
                    />
                </div>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {projects.map((project) => (
                    <motion.div key={project.id} variants={item}>
                        <Card className="overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group hover:-translate-y-1">
                            <div className="relative aspect-video bg-muted overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6 z-10">
                                    <Button asChild size="sm" className="w-full rounded-full bg-white text-black hover:bg-white/90">
                                        <Link href={`/community/${project.id}`}>
                                            查看详情
                                        </Link>
                                    </Button>
                                </div>

                                {/* Placeholder for project preview */}
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted/50 group-hover:scale-105 transition-transform duration-500">
                                    <Sparkles className="h-12 w-12" />
                                </div>

                                {project.price > 0 ? (
                                    <Badge className="absolute top-3 right-3 bg-amber-500/90 hover:bg-amber-600 backdrop-blur-sm shadow-sm">
                                        {project.price} 积分
                                    </Badge>
                                ) : (
                                    <Badge className="absolute top-3 right-3 bg-emerald-500/90 hover:bg-emerald-600 backdrop-blur-sm shadow-sm">
                                        免费
                                    </Badge>
                                )}
                            </div>

                            <CardHeader className="pb-2">
                                <CardTitle className="line-clamp-1 text-lg">{project.name}</CardTitle>
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-3 w-3 text-primary" />
                                    </div>
                                    <span>{project.user?.email?.split('@')[0] || '匿名用户'}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {project.description || "暂无描述。"}
                                </p>
                            </CardContent>

                            <CardFooter className="border-t border-border/30 pt-4 flex justify-between items-center bg-muted/20">
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span className="text-sm font-medium">{project.averageRating.toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({project.ratingCount})</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {/* Maybe add tags or date here */}
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
