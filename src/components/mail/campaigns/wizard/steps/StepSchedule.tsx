'use client';

import { useWizardStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export function StepSchedule() {
    const { data, updateData } = useWizardStore();
    const [sendType, setSendType] = useState('now');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Schedule & Send</CardTitle>
                <CardDescription>When should this campaign be sent?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <RadioGroup
                    defaultValue="now"
                    value={sendType}
                    onValueChange={(val) => {
                        setSendType(val);
                        if (val === 'now') updateData({ scheduledAt: null });
                    }}
                    className="grid grid-cols-2 gap-4"
                >
                    <div>
                        <RadioGroupItem value="now" id="now" className="peer sr-only" />
                        <Label
                            htmlFor="now"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <span className="text-lg font-semibold mb-1">Send Now</span>
                            <span className="text-sm text-muted-foreground">Start sending immediately</span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="later" id="later" className="peer sr-only" />
                        <Label
                            htmlFor="later"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <span className="text-lg font-semibold mb-1">Schedule Later</span>
                            <span className="text-sm text-muted-foreground">Pick a date and time</span>
                        </Label>
                    </div>
                </RadioGroup>

                {sendType === 'later' && (
                    <div className="flex flex-col space-y-2">
                        <Label>Send Date</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                className="w-[240px]"
                                onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value) : null;
                                    updateData({ scheduledAt: date });
                                }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Select a date to schedule.</p>
                    </div>
                )}

                <div className="bg-muted/30 p-4 rounded-md space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Recipients:</span>
                        <span className="font-medium">{data.audienceIds.length} contacts</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Cost:</span>
                        <span className="font-medium">0 Credits</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
