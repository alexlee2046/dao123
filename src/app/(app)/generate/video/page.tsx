'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Video, Construction } from "lucide-react"

export default function VideoGenerationPage() {
    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="flex flex-col gap-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Video className="h-8 w-8 text-primary" />
                        AI Video Generator
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Turn text into dynamic videos.
                    </p>
                </div>

                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="bg-primary/10 p-6 rounded-full mb-6">
                            <Construction className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            We are currently integrating with top-tier video generation models like Runway Gen-2 and Stable Video Diffusion. Stay tuned!
                        </p>
                        <Button variant="outline" disabled>
                            Join Waitlist
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
