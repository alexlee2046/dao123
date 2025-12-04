import React from 'react';
import { useNode } from '@craftjs/core';
import { Button } from '@/components/ui/button';

export interface BuilderButtonProps {
    text: string;
    href?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    className?: string;
}

export const BuilderButton = ({ text, href, variant = 'default', className = '' }: BuilderButtonProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            className={`inline-block ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
        >
            <Button variant={variant} className={className} asChild={!!href}>
                {href ? <a href={href}>{text}</a> : text}
            </Button>
        </div>
    );
};

BuilderButton.craft = {
    displayName: 'Button',
    props: {
        text: 'Click Me',
        variant: 'default',
        className: '',
        href: '#'
    }
};
