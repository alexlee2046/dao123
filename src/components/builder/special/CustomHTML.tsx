import React from 'react';
import { useNode, useEditor } from '@craftjs/core';

export interface CustomHTMLProps {
    code: string;
    className?: string;
}

export const CustomHTML = ({ code, className = '' }: CustomHTMLProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            className={`${className} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
            dangerouslySetInnerHTML={{ __html: code }}
            onClick={(e) => {
                if (enabled) {
                    // Prevent default behavior to avoid navigation or form submission in editor
                    // We only do this in editor mode
                    // Note: This relies on event bubbling. If an inner element stops propagation, this won't run.
                    e.preventDefault();
                }
            }}
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
