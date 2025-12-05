import React from 'react';
import { useNode } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderImageProps extends BuilderStyleProps {
    src: string;
    alt: string;
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
    className?: string;
}

export const BuilderImage = ({ src, alt, objectFit = 'cover', className = '', ...props }: BuilderImageProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    return (
        <img
            ref={(ref: any) => connect(drag(ref))}
            src={src}
            alt={alt}
            style={{ ...styles, objectFit }}
            className={`${classes} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
        />
    );
};

BuilderImage.craft = {
    displayName: 'Image',
    props: {
        src: 'https://placehold.co/600x400',
        alt: 'Placeholder Image',
        objectFit: 'cover',
        className: 'w-full h-auto rounded-lg',
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    }
};
