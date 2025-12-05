import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface NavItem {
    label: string;
    href: string;
}

export interface BuilderNavbarProps extends BuilderStyleProps {
    logo?: string;
    logoText?: string;
    items?: NavItem[];
    ctaText?: string;
    ctaHref?: string;
    showCta?: boolean;
    variant?: 'light' | 'dark' | 'transparent';
    sticky?: boolean;
    className?: string;
}

const defaultItems: NavItem[] = [
    { label: 'Home', href: '#' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Contact', href: '#contact' },
];

export const BuilderNavbar = ({
    logo,
    logoText = 'Brand',
    items = defaultItems,
    ctaText = 'Get Started',
    ctaHref = '#',
    showCta = true,
    variant = 'light',
    sticky = true,
    className = '',
    ...props
}: BuilderNavbarProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    const variantStyles: Record<string, { bg: string; text: string; ctaBg: string }> = {
        light: {
            bg: 'bg-white border-b border-gray-200',
            text: 'text-gray-700 hover:text-gray-900',
            ctaBg: 'bg-blue-600 text-white hover:bg-blue-700',
        },
        dark: {
            bg: 'bg-gray-900',
            text: 'text-gray-300 hover:text-white',
            ctaBg: 'bg-blue-600 text-white hover:bg-blue-700',
        },
        transparent: {
            bg: 'bg-transparent',
            text: 'text-gray-700 hover:text-gray-900',
            ctaBg: 'bg-blue-600 text-white hover:bg-blue-700',
        },
    };

    const variantStyle = variantStyles[variant];

    return (
        <nav
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`
                ${variantStyle.bg}
                ${sticky ? 'sticky top-0 z-50' : ''}
                ${classes} 
                ${selected ? 'outline outline-2 outline-blue-500 z-[60] relative' : ''} 
                ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-[60] relative' : ''}
            `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        {logo ? (
                            <img src={logo} alt={logoText} className="h-8 w-auto" />
                        ) : (
                            <span className={`text-xl font-bold ${variant === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {logoText}
                            </span>
                        )}
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {items.map((item, index) => (
                            <a
                                key={index}
                                href={item.href}
                                className={`${variantStyle.text} transition-colors text-sm font-medium`}
                                onClick={(e) => enabled && e.preventDefault()}
                            >
                                {item.label}
                            </a>
                        ))}
                    </div>

                    {/* CTA Button */}
                    {showCta && (
                        <div className="flex items-center">
                            <a
                                href={ctaHref}
                                className={`${variantStyle.ctaBg} px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                                onClick={(e) => enabled && e.preventDefault()}
                            >
                                {ctaText}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

BuilderNavbar.craft = {
    displayName: 'Navbar',
    props: {
        logoText: 'Brand',
        items: defaultItems,
        ctaText: 'Get Started',
        ctaHref: '#',
        showCta: true,
        variant: 'light',
        sticky: true,
        className: 'w-full',
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    }
};
