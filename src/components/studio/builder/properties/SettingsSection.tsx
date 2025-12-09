
import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function SettingsSection({
    title,
    children,
    defaultOpen = true
}: SettingsSectionProps) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full py-2 text-sm font-medium hover:bg-accent/50 px-2 rounded transition-colors">
                    <span>{title}</span>
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pb-4 space-y-3">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
