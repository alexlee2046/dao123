'use client';

import { Link } from '@/components/link';
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export interface FeaturedProject {
    id: string;
    name: string;
    description?: string;
    preview_image: string;
    user?: {
        email?: string;
    };
}

interface FeaturedProjectsProps {
    projects: FeaturedProject[];
    projectLabel: string;
    byUserLabel: string;
}

export function FeaturedProjects({ projects, projectLabel, byUserLabel }: FeaturedProjectsProps) {
    // If no projects with images, show placeholders
    const displayProjects = projects.length > 0 ? projects : [null, null, null];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProjects.map((project, index) => (
                <motion.div
                    key={project?.id || `placeholder-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                >
                    {project ? (
                        <Link href={`/community/${project.id}`} className="block">
                            <div className="group relative aspect-video rounded-2xl overflow-hidden bg-muted shadow-lg hover:shadow-xl transition-all duration-300">
                                <img
                                    src={project.preview_image}
                                    alt={project.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <h4 className="font-bold text-lg line-clamp-1">{project.name}</h4>
                                        <p className="text-sm text-white/80">
                                            {byUserLabel.replace('{user}', project.user?.email?.split('@')[0] || 'anonymous')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div className="group relative aspect-video rounded-2xl overflow-hidden bg-muted">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <div className="text-white">
                                    <h4 className="font-bold text-lg">{projectLabel.replace('{i}', String(index + 1))}</h4>
                                    <p className="text-sm text-white/80">{byUserLabel.replace('{user}', 'Creator')}</p>
                                </div>
                            </div>
                            {/* Placeholder visual */}
                            <div className="w-full h-full bg-muted-foreground/10 flex items-center justify-center text-muted-foreground/30">
                                <Sparkles className="h-12 w-12" />
                            </div>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
