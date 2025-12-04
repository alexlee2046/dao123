import React from 'react';
import { useNode } from '@craftjs/core';

export interface BuilderImageProps {
    src: string;
    alt: string;
    className?: string;
}

export const BuilderImage = ({ src, alt, className = '' }: BuilderImageProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    return (
        <img
            ref={(ref: any) => connect(drag(ref))}
            src={src}
            alt={alt}
            className={`${className} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
        />
    );
};

BuilderImage.craft = {
    displayName: 'Image',
    props: {
        src: 'https://placehold.co/600x400',
        alt: 'Placeholder Image',
        className: 'w-full h-auto rounded-lg'
    }
};
