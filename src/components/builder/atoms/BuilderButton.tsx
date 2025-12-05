import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames, getAnimationProps } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderButtonProps extends BuilderStyleProps {
    text: string;
    href?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

export const BuilderButton = ({ text, href, variant = 'default', size = 'default', className = '', ...props }: BuilderButtonProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);
    const animationProps = getAnimationProps(props.animation);

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`inline-block ${classes} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
            {...animationProps}
        >
            <Button variant={variant} size={size} className="w-full h-full" asChild={!!href}>
                {href ? <a href={href} onClick={(e) => enabled && e.preventDefault()}>{text}</a> : text}
            </Button>
        </motion.div>
    );
};

BuilderButton.craft = {
    displayName: 'Button',
    props: {
        text: 'Click Me',
        variant: 'default',
        size: 'default',
        className: '',
        href: '#',
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        animation: { type: 'none', duration: 0.5, delay: 0, infinite: false }
    }
};
