import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="w-full max-w-7xl mx-auto py-10 px-10 md:px-16 lg:px-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">我的网站</h1>
                    <p className="text-muted-foreground">管理你的 AI 生成的网站。</p>
                </div>
                <Button asChild>
                    <Link href="/studio/new">
                        <Plus className="mr-2 h-4 w-4" />
                        创建新网站
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* New Site Card */}
                <Card className="border-dashed flex flex-col items-center justify-center min-h-[200px] hover:bg-muted/50 transition-colors cursor-pointer">
                    <Link href="/studio/new" className="flex flex-col items-center justify-center w-full h-full">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">创建新网站</h3>
                    </Link>
                </Card>

                {/* Example Project Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>咖啡店落地页</CardTitle>
                        <CardDescription>2小时前编辑</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video bg-muted rounded-md w-full"></div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm">预览</Button>
                        <Button size="sm" asChild>
                            <Link href="/studio/123">编辑</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
