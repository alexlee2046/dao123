import React from 'react';
import { useNode } from '@craftjs/core';

export interface BuilderTextProps {
    text: string;
    tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
    className?: string;
}

export const BuilderText = ({ text, tag = 'p', className = '' }: BuilderTextProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const Component = tag as any;

    return (
        <Component
            ref={(ref: any) => connect(drag(ref))}
            className={`${className} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
        >
            {text}
        </Component>
    );
};

BuilderText.craft = {
    displayName: 'Text',
    props: {
        text: 'Hello World',
        tag: 'p',
        className: 'text-base text-gray-800'
    }
};
