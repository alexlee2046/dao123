'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface AISearchFormProps {
    onSelectDomain: (domain: string) => void;
}

export function AISearchForm({ onSelectDomain }: AISearchFormProps) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSuggestions([]);

        try {
            const res = await fetch('/api/ai/search', {
                method: 'POST',
                body: JSON.stringify({ query }),
            });

            if (!res.ok) throw new Error('AI Search failed');

            const text = await res.text();
            try {
                // Try to parse JSON array from text (sometimes LLM adds extra text despite instructions)
                // We asked for ONLY JSON array, but double check.
                const jsonMatch = text.match(/\[[\s\S]*\]/);
                const json = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

                if (Array.isArray(json)) {
                    setSuggestions(json);
                    if (json.length === 0) toast.info('AI could not find matching domains.');
                } else {
                    toast.error('AI returned unexpected format');
                }
            } catch (e) {
                console.error("Parse error", text);
                toast.error('Failed to parse AI response');
            }
        } catch (err) {
            toast.error('Something went wrong');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full border-purple-200 bg-purple-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Discover
                </CardTitle>
                <CardDescription>
                    Describe your target customers (e.g. "Top 10 SaaS companies in San Francisco") and AI will find their domains.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Describe companies..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !query} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Ask AI
                    </Button>
                </form>

                {suggestions.length > 0 && (
                    <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">AI Suggestions:</div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {suggestions.map((domain, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg border hover:border-purple-300 transition-all group">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="font-mono text-sm">{domain}</span>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 opacity-0 group-hover:opacity-100 transition-opacity text-purple-600" onClick={() => onSelectDomain(domain)}>
                                        Search
                                        <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
