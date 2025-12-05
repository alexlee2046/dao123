import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';

export interface BuilderHeroProps extends BuilderStyleProps {
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonHref?: string;
    secondaryButtonText?: string;
    secondaryButtonHref?: string;
    showSecondaryButton?: boolean;
    className?: string;
}

export const BuilderHero = ({
    title = 'Welcome to Our Website',
    subtitle = 'Discover Amazing Things',
    description = 'Create stunning websites with our powerful drag-and-drop builder.',
    buttonText = 'Get Started',
    buttonHref = '#',
    secondaryButtonText = 'Learn More',
    secondaryButtonHref = '#',
    showSecondaryButton = true,
    className = '',
    ...props
}: BuilderHeroProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    const alignClasses: Record<string, string> = {
        left: 'items-start',
        center: 'items-center',
        right: 'items-end',
        justify: 'items-stretch'
    };

    // Default values for style props if not provided
    const styleProps = {
        backgroundColor: '#f8fafc',
        minHeight: '500px',
        textAlign: 'center' as const,
        padding: { top: '64px', right: '32px', bottom: '64px', left: '32px' }, // px-8 py-16 equivalent approx
        ...props
    };

    const styles = getBuilderStyles(styleProps);
    const classes = getBuilderClassNames(styleProps, className);

    // Handle alignment specifically for flex container
    const alignmentClass = styleProps.textAlign && alignClasses[styleProps.textAlign] ? alignClasses[styleProps.textAlign] : 'items-center';

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`
                flex flex-col justify-center
                ${alignmentClass}
                ${classes} 
                ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} 
                ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}
            `}
        >
            <div className={`max-w-4xl w-full ${styleProps.textAlign === 'center' ? 'mx-auto' : ''}`}>
                {subtitle && (
                    <span className="text-blue-600 font-medium mb-2 block">{subtitle}</span>
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                    {title}
                </h1>
                {description && (
                    <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
                        {description}
                    </p>
                )}
                <div className={`flex gap-4 ${styleProps.textAlign === 'center' ? 'justify-center' : ''}`}>
                    <a
                        href={buttonHref}
                        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        onClick={(e) => enabled && e.preventDefault()}
                    >
                        {buttonText}
                    </a>
                    {showSecondaryButton && (
                        <a
                            href={secondaryButtonHref}
                            className="inline-block bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                            onClick={(e) => enabled && e.preventDefault()}
                        >
                            {secondaryButtonText}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

BuilderHero.craft = {
    displayName: 'Hero Section',
    props: {
        title: 'Welcome to Our Website',
        subtitle: 'Discover Amazing Things',
        description: 'Create stunning websites with our powerful drag-and-drop builder.',
        buttonText: 'Get Started',
        buttonHref: '#',
        secondaryButtonText: 'Learn More',
        secondaryButtonHref: '#',
        showSecondaryButton: true,
        backgroundColor: '#f8fafc',
        textAlign: 'center',
        minHeight: '500px',
        padding: { top: '64px', right: '32px', bottom: '64px', left: '32px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    }
};
