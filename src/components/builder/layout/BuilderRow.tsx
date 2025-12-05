import React from 'react';
import { useNode } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderRowProps extends BuilderStyleProps {
    children?: React.ReactNode;
    gap?: string;
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    wrap?: boolean;
    className?: string;
}

const justifyClasses: Record<string, string> = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
};

const alignClasses: Record<string, string> = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
};

export const BuilderRow = ({
    children,
    gap = '16px',
    justify = 'start',
    align = 'center',
    wrap = true,
    className = '',
    ...props
}: BuilderRowProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={{ ...styles, gap }}
            className={`
                flex flex-row 
                ${justifyClasses[justify]} 
                ${alignClasses[align]} 
                ${wrap ? 'flex-wrap' : 'flex-nowrap'}
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

BuilderRow.craft = {
    displayName: 'Row',
    props: {
        gap: '16px',
        justify: 'start',
        align: 'center',
        wrap: true,
        className: 'w-full',
        padding: { top: '8px', right: '8px', bottom: '8px', left: '8px' }, // p-2 equivalent
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    },
    rules: {
        canDrag: () => true,
    }
};
