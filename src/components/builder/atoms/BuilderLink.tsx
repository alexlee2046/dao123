import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderLinkProps extends BuilderStyleProps {
    text: string;
    href: string;
    target?: '_self' | '_blank';
    textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
    className?: string;
}

export const BuilderLink = ({
    text,
    href = '#',
    target = '_self',
    textDecoration = 'none',
    className = '',
    ...props
}: BuilderLinkProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    return (
        <a
            ref={(ref: any) => connect(drag(ref))}
            href={href}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            style={{ ...styles, textDecoration }}
            className={`${classes} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''} cursor-pointer`}
            onClick={(e) => enabled && e.preventDefault()}
        >
            {text}
        </a>
    );
};

BuilderLink.craft = {
    displayName: 'Link',
    props: {
        text: 'Click here',
        href: '#',
        target: '_self',
        textDecoration: 'none',
        className: 'text-blue-600 hover:underline',
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    }
};
