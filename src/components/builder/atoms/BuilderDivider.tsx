import React from 'react';
import { useNode } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderDividerProps extends BuilderStyleProps {
    orientation?: 'horizontal' | 'vertical';
    thickness?: string;
    color?: string;
    className?: string;
}

export const BuilderDivider = ({
    orientation = 'horizontal',
    thickness = '1px',
    color = '#e5e7eb',
    className = '',
    ...props
}: BuilderDividerProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);

    const builderStyles = getBuilderStyles(props, previewDevice);
    const builderClasses = getBuilderClassNames(props, className, previewDevice);

    const dividerStyle: React.CSSProperties = orientation === 'horizontal'
        ? { height: thickness, backgroundColor: color, width: '100%' }
        : { width: thickness, backgroundColor: color, height: '100%', minHeight: '20px' };

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={{ ...builderStyles, ...dividerStyle }}
            className={`${builderClasses} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
        />
    );
};

BuilderDivider.craft = {
    displayName: 'Divider',
    props: {
        orientation: 'horizontal',
        thickness: '1px',
        color: '#e5e7eb',
        className: 'my-4'
    }
};
