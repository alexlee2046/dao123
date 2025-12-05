import React from 'react';
import { useNode } from '@craftjs/core';
import { motion } from 'framer-motion';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames, getAnimationProps } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderContainerProps extends BuilderStyleProps {
    children?: React.ReactNode;
    className?: string;
}

export const BuilderContainer = ({ children, className = '', ...props }: BuilderContainerProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);
    const animationProps = getAnimationProps(props.animation);

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`${classes} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''} min-h-[50px] border border-transparent hover:border-dashed hover:border-gray-300`}
            {...animationProps}
        >
            {children}
        </motion.div>
    );
};

BuilderContainer.craft = {
    displayName: 'Container',
    props: {
        className: 'w-full bg-white',
        padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        animation: { type: 'none', duration: 0.5, delay: 0, infinite: false }
    }
};
