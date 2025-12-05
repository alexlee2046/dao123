import React from 'react';
import { useNode } from '@craftjs/core';
import { motion } from 'framer-motion';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames, getAnimationProps } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderTextProps extends BuilderStyleProps {
    text: string;
    tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
    className?: string;
}

export const BuilderText = ({ text, tag = 'p', className = '', ...props }: BuilderTextProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    // Use motion(tag) to create an animated component dynamically
    const Component = React.useMemo(() => motion(tag), [tag]);
    
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);
    const animationProps = getAnimationProps(props.animation);

    return (
        <Component
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`${classes} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
            {...animationProps}
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
        className: 'text-base text-gray-800',
        fontSize: '16px',
        fontWeight: 'normal',
        lineHeight: '1.5',
        textAlign: 'left',
        textDecoration: 'none',
        color: '#1f2937', // text-gray-800
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        animation: { type: 'none', duration: 0.5, delay: 0, infinite: false }
    }
};
