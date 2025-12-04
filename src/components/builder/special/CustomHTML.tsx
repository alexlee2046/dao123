import React from 'react';
import { useNode } from '@craftjs/core';

export interface CustomHTMLProps {
    code: string;
    className?: string;
}

export const CustomHTML = ({ code, className = '' }: CustomHTMLProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            className={`${className} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
            dangerouslySetInnerHTML={{ __html: code }}
        />
    );
};

CustomHTML.craft = {
    displayName: 'Custom HTML',
    props: {
        code: '<div class="p-4 bg-yellow-100 text-yellow-800 rounded">Custom HTML Block</div>',
        className: ''
    }
};
