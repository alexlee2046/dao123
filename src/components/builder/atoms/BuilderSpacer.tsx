import React from 'react';
import { useNode } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderSpacerProps extends BuilderStyleProps {
    height?: string;
    className?: string;
}

export const BuilderSpacer = ({
    height = '24px',
    className = '',
    ...props
}: BuilderSpacerProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    // Explicitly merge height into props for getBuilderStyles if it's not already there by ...props
    // But getBuilderStyles uses props.height if available.
    // However, we want to respect the 'height' prop passed in directly as default if not in style props.
    // Actually, BuilderStyleProps has height. So ...props should cover it if it comes from Craft.
    // But we should ensure the default is applied if prop is missing.
    // Actually, the component receives standard props. logic:

    // 1. Get styles from utils
    const styles = getBuilderStyles({ height, ...props }, previewDevice);
    // 2. Get classes
    const classes = getBuilderClassNames(props, className, previewDevice);

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`${classes} w-full ${selected ? 'outline outline-2 outline-blue-500 z-10 relative bg-blue-50/50' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative bg-gray-50/50' : ''}`}
        />
    );
};

BuilderSpacer.craft = {
    displayName: 'Spacer',
    props: {
        height: '24px',
        className: ''
    }
};
