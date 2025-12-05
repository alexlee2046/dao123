import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { BuilderText } from '../atoms/BuilderText';
import { BuilderImage } from '../atoms/BuilderImage';
import { BuilderButton } from '../atoms/BuilderButton';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderCardProps extends BuilderStyleProps {
    imageSrc?: string;
    title?: string;
    description?: string;
    buttonText?: string;
    buttonHref?: string;
    showImage?: boolean;
    showButton?: boolean;
    variant?: 'default' | 'bordered' | 'elevated';
    className?: string;
}

export const BuilderCard = ({
    imageSrc = 'https://placehold.co/400x200',
    title = 'Card Title',
    description = 'This is a description for the card.',
    buttonText = 'Learn More',
    buttonHref = '#',
    showImage = true,
    showButton = true,
    variant = 'default',
    className = '',
    ...props
}: BuilderCardProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    const previewDevice = useStudioStore((state) => state.previewDevice);

    const variantStyles: Record<string, string> = {
        default: 'bg-white',
        bordered: 'bg-white border border-gray-200',
        elevated: 'bg-white shadow-lg',
    };

    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    // If user sets border/shadow manually, we might want to ignore variant styles for those properties
    // But for simplicity, we let utility classes stack.
    // Variant is just a preset.

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`
                rounded-lg overflow-hidden
                ${variantStyles[variant]}
                ${classes} 
                ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} 
                ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}
            `}
        >
            {showImage && (
                <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-48 object-cover"
                />
            )}
            <div className="p-4 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                <p className="text-gray-600 text-sm">{description}</p>
                {showButton && (
                    <a
                        href={buttonHref}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                        onClick={(e) => enabled && e.preventDefault()}
                    >
                        {buttonText}
                    </a>
                )}
            </div>
        </div>
    );
};

BuilderCard.craft = {
    displayName: 'Card',
    props: {
        imageSrc: 'https://placehold.co/400x200',
        title: 'Card Title',
        description: 'This is a description for the card.',
        buttonText: 'Learn More',
        buttonHref: '#',
        showImage: true,
        showButton: true,
        variant: 'default',
        className: 'w-full max-w-sm',
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    }
};
