'use client';

import { useWizardStore } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function StepSettings() {
    const { data, updateData } = useWizardStore();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
                <CardDescription>Setup the basic information for your email campaign.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input
                        id="name"
                        placeholder="e.g. Monthly Newsletter"
                        value={data.name}
                        onChange={(e) => updateData({ name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Internal name, not visible to recipients.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                        id="subject"
                        placeholder="e.g. Check out our new features!"
                        value={data.subject}
                        onChange={(e) => updateData({ subject: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                            id="fromName"
                            placeholder="e.g. DaoMail Team"
                            value={data.fromName}
                            onChange={(e) => updateData({ fromName: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                            id="fromEmail"
                            type="email"
                            placeholder="e.g. hello@daomail.com"
                            value={data.fromEmail}
                            onChange={(e) => updateData({ fromEmail: e.target.value })}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
