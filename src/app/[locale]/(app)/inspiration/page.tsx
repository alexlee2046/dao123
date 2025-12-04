import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Copy } from "lucide-react";

const TEMPLATES = [
    {
        id: '1',
        title: '现代作品集',
        description: '为设计师打造的时尚深色模式作品集。',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
        tags: ['作品集', '深色模式'],
        stars: 128
    },
    {
        id: '2',
        title: '咖啡店落地页',
        description: '温馨诱人的咖啡馆落地页。',
        image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
        tags: ['商业', '餐饮'],
        stars: 85
    },
    {
        id: '3',
        title: 'SaaS 初创公司',
        description: '简洁的软件产品转化页面。',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        tags: ['初创公司', 'B2B'],
        stars: 240
    },
    {
        id: '4',
        title: '个人博客',
        description: '为作家打造的极简博客模板。',
        image: 'https://images.unsplash.com/photo-1499750310159-52f0f835497a?auto=format&fit=crop&w=800&q=80',
        tags: ['博客', '极简'],
        stars: 56
    }
];

export default function InspirationPage() {
    return (
        <div className="w-full max-w-7xl mx-auto py-10 px-10 md:px-16 lg:px-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">灵感广场</h1>
                    <p className="text-muted-foreground">探索并复用社区模板。</p>
                </div>
                <Button variant="outline">
                    提交你的模板
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {TEMPLATES.map((template) => (
                    <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video relative overflow-hidden">
                            <img
                                src={template.image}
                                alt={template.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    {template.stars}
                                </Badge>
                            </div>
                        </div>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg">{template.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex flex-wrap gap-2">
                                {template.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs font-normal">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Button className="w-full" asChild>
                                <Link href={`/studio/remix/${template.id}`}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    复用模板
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
