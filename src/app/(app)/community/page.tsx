import { getCommunityProjects } from "@/lib/actions/community";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, User, ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function CommunityPage() {
    const projects = await getCommunityProjects();

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Inspiration Gallery</h1>
                    <p className="text-muted-foreground">Discover and support creators</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project: any) => (
                    <Card key={project.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                        <div className="relative aspect-video bg-muted">
                            {/* Placeholder for project preview - ideally we generate a screenshot or use a stored one */}
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                <span className="text-4xl">🎨</span>
                            </div>
                            {project.price > 0 && (
                                <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">
                                    {project.price} Credits
                                </Badge>
                            )}
                            {project.price === 0 && (
                                <Badge className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600">
                                    Free
                                </Badge>
                            )}
                        </div>

                        <CardHeader>
                            <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                            <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <User className="h-3 w-3" />
                                <span>{project.user?.email?.split('@')[0] || 'Anonymous'}</span>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {project.description || "No description provided."}
                            </p>
                        </CardContent>

                        <CardFooter className="border-t pt-4 flex justify-between items-center">
                            <div className="flex items-center gap-1 text-amber-500">
                                <Star className="h-4 w-4 fill-current" />
                                <span className="text-sm font-medium">{project.averageRating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({project.ratingCount})</span>
                            </div>

                            <Button asChild size="sm">
                                <Link href={`/community/${project.id}`}>
                                    View Details
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
