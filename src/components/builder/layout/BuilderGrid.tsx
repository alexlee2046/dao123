import React from 'react';
import { useNode } from '@craftjs/core';

import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderGridProps extends BuilderStyleProps {
    children?: React.ReactNode;
    columns?: number;
    gap?: string;
    className?: string;
}

export const BuilderGrid = ({
    children,
    columns = 3,
    gap = '16px',
    className = '',
    ...props
}: BuilderGridProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    // Pass columns and gap to getBuilderStyles so they can be handled responsively
    const styles = getBuilderStyles({ ...props, columns, gap }, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`
                grid 
                ${classes} 
                ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} 
                ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''} 
                min-h-[40px] p-2
            `}
        >
            {children}
        </div>
    );
};

BuilderGrid.craft = {
    displayName: 'Grid',
    props: {
        columns: 3,
        gap: '16px',
        className: 'w-full',
        padding: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    },
    rules: {
        canDrag: () => true,
    }
};
