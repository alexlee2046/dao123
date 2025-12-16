'use client';

import { useWizardStore } from '../store';
import { AIWriterDialog } from './AIWriterDialog';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function StepContent() {
    const { data, updateData, setStep } = useWizardStore();
    const [showAI, setShowAI] = useState(false);

    const handleAIWrite = () => {
        setShowAI(true);
    };

    const handleUseContent = (content: string) => {
        updateData({ contentJson: { html: content } }); // Simple mock structure
        toast.success("Content applied to editor!");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Email Content</CardTitle>
                    <CardDescription>Design your email content. Use templates or AI assistant.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-all text-center space-y-3"
                        onClick={() => toast.info("Template selection coming soon")}
                    >
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Select Template</h3>
                            <p className="text-sm text-muted-foreground">Choose from our gallery</p>
                        </div>
                    </div>

                    <div
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all text-center space-y-3 border-purple-200"
                        onClick={handleAIWrite}
                    >
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-purple-900">AI Writer</h3>
                            <p className="text-sm text-purple-700">Generate draft instantly</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="border rounded-md p-4 bg-muted/20 min-h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                    {data.contentJson?.html ? (
                        <div className="text-left prose max-w-none bg-white p-6 rounded shadow-sm" dangerouslySetInnerHTML={{ __html: data.contentJson.html }} />
                    ) : (
                        <>
                            <p>Editor Preview Placeholder</p>
                            <Button variant="link" className="mt-2" onClick={() => toast.info("Opening Editor...")}>
                                Open Full Editor
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <AIWriterDialog
                open={showAI}
                onOpenChange={setShowAI}
                onUseContent={handleUseContent}
            />
        </div>
    );
}
