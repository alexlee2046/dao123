import React from 'react';
import { useNode } from '@craftjs/core';

export interface BuilderContainerProps {
    children?: React.ReactNode;
    className?: string;
}

export const BuilderContainer = ({ children, className = '' }: BuilderContainerProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            className={`${className} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''} min-h-[50px] p-2 border border-transparent hover:border-dashed hover:border-gray-300`}
        >
            {children}
        </div>
    );
};

BuilderContainer.craft = {
    displayName: 'Container',
    props: {
        className: 'w-full p-4 bg-white'
    }
};
