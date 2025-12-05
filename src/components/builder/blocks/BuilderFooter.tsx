import React from 'react';
import { useNode, useEditor } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface FooterColumn {
    title: string;
    links: { label: string; href: string }[];
}

export interface BuilderFooterProps extends BuilderStyleProps {
    logoText?: string;
    description?: string;
    footerColumns?: FooterColumn[];
    copyright?: string;
    showSocialLinks?: boolean;
    variant?: 'light' | 'dark';
    className?: string;
}

const defaultColumns: FooterColumn[] = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#' },
            { label: 'Pricing', href: '#' },
            { label: 'API', href: '#' },
        ]
    },
    {
        title: 'Company',
        links: [
            { label: 'About', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Careers', href: '#' },
        ]
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', href: '#' },
            { label: 'Contact', href: '#' },
            { label: 'Privacy', href: '#' },
        ]
    },
];

export const BuilderFooter = ({
    logoText = 'Brand',
    description = 'Building amazing websites with ease.',
    footerColumns = defaultColumns,
    copyright = '© 2024 Brand. All rights reserved.',
    showSocialLinks = true,
    variant = 'dark',
    className = '',
    ...props
}: BuilderFooterProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    const variantStyles: Record<string, { bg: string; titleText: string; text: string; border: string }> = {
        light: {
            bg: 'bg-gray-50',
            titleText: 'text-gray-900',
            text: 'text-gray-600 hover:text-gray-900',
            border: 'border-gray-200',
        },
        dark: {
            bg: 'bg-gray-900',
            titleText: 'text-white',
            text: 'text-gray-400 hover:text-white',
            border: 'border-gray-800',
        },
    };

    const variantStyle = variantStyles[variant];

    return (
        <footer
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`
                ${variantStyle.bg}
                ${classes} 
                ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} 
                ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}
            `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <h3 className={`text-xl font-bold ${variantStyle.titleText} mb-4`}>{logoText}</h3>
                        <p className={`${variantStyle.text} mb-4 max-w-sm`}>{description}</p>

                        {showSocialLinks && (
                            <div className="flex space-x-4">
                                {['twitter', 'github', 'linkedin'].map((social) => (
                                    <a
                                        key={social}
                                        href="#"
                                        className={`${variantStyle.text} transition-colors`}
                                        onClick={(e) => enabled && e.preventDefault()}
                                    >
                                        <span className="sr-only">{social}</span>
                                        <div className="h-6 w-6 bg-current rounded opacity-50"></div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Link Columns */}
                    {footerColumns.map((column, index) => (
                        <div key={index}>
                            <h4 className={`text-sm font-semibold ${variantStyle.titleText} uppercase tracking-wider mb-4`}>
                                {column.title}
                            </h4>
                            <ul className="space-y-3">
                                {column.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <a
                                            href={link.href}
                                            className={`${variantStyle.text} text-sm transition-colors`}
                                            onClick={(e) => enabled && e.preventDefault()}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Copyright */}
                <div className={`mt-12 pt-8 border-t ${variantStyle.border}`}>
                    <p className={`${variantStyle.text} text-sm text-center`}>{copyright}</p>
                </div>
            </div>
        </footer>
    );
};

BuilderFooter.craft = {
    displayName: 'Footer',
    props: {
        logoText: 'Brand',
        description: 'Building amazing websites with ease.',
        footerColumns: defaultColumns,
        copyright: '© 2024 Brand. All rights reserved.',
        showSocialLinks: true,
        variant: 'dark',
        className: 'w-full',
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    }
};
