import { ComponentNode } from './schemas';
import { nanoid } from 'nanoid';

type CraftNode = {
    type: { resolvedName: string };
    isCanvas?: boolean;
    props: Record<string, any>;
    displayName: string;
    custom: Record<string, any>;
    hidden: boolean;
    nodes: string[];
    linkedNodes: Record<string, string>;
    parent?: string;
};

type CraftJson = Record<string, CraftNode>;

export function convertToCraftJson(componentTree: ComponentNode): string {
    const nodes: CraftJson = {};
    const rootId = 'ROOT';

    nodes[rootId] = {
        type: { resolvedName: 'BuilderContainer' },
        isCanvas: true,
        props: { className: 'w-full min-h-screen bg-white p-8 flex flex-col gap-4' },
        displayName: 'BuilderContainer',
        custom: {},
        hidden: false,
        nodes: [],
        linkedNodes: {},
    };

    function traverse(node: ComponentNode, parentId: string) {


        const id = nanoid(10);
        if (nodes[parentId]) {
            nodes[parentId].nodes.push(id);
        }

        nodes[id] = {
            type: { resolvedName: node.type },
            props: node.props || {},
            displayName: node.type,
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {},
            parent: parentId,
        };

        if (node.children && node.children.length > 0) {
            node.children.forEach(child => traverse(child, id));
        }
    }

    traverse(componentTree, rootId);
    return JSON.stringify(nodes);
}

export function mergeSectionsToCraftJson(sections: ComponentNode[]): string {
    const nodes: CraftJson = {};
    const rootId = 'ROOT';

    nodes[rootId] = {
        type: { resolvedName: 'BuilderContainer' },
        isCanvas: true,
        props: { className: 'w-full min-h-screen bg-white flex flex-col' },
        displayName: 'Document',
        custom: {},
        hidden: false,
        nodes: [],
        linkedNodes: {},
    };

    function traverse(node: ComponentNode, parentId: string) {


        const id = nanoid(10);
        nodes[parentId].nodes.push(id);

        nodes[id] = {
            type: { resolvedName: node.type },
            props: node.props || {},
            displayName: node.type,
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {},
            parent: parentId,
        };

        if (node.children) {
            node.children.forEach(child => traverse(child, id));
        }
    }

    sections.forEach(section => traverse(section, rootId));
    return JSON.stringify(nodes);
}

export function componentNodeToHtml(node: ComponentNode): string {
    const { type, props, children } = node;

    // --- Complex Sections with custom premium templates ---

    if (type === 'BuilderHero') {
        const { title, subtitle, description, buttonText, buttonHref, secondaryButtonText, secondaryButtonHref, className } = props;
        return `
<section class="relative overflow-hidden bg-white py-24 px-6 ${className || ''}">
    <div class="max-w-7xl mx-auto flex flex-col items-center text-center">
        ${title ? `<h1 class="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">${title}</h1>` : ''}
        ${(subtitle || description) ? `<p class="text-xl text-gray-500 max-w-3xl mb-10">${subtitle || description}</p>` : ''}
        <div class="flex flex-wrap justify-center gap-4">
            ${buttonText ? `<a href="${buttonHref || '#'}" class="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition">${buttonText}</a>` : ''}
            ${secondaryButtonText ? `<a href="${secondaryButtonHref || '#'}" class="px-8 py-3 bg-white text-indigo-600 border border-indigo-200 font-semibold rounded-lg hover:bg-gray-50 transition">${secondaryButtonText}</a>` : ''}
        </div>
    </div>
</section>`;
    }

    if (type === 'BuilderNavbar') {
        const { logoText, items, ctaText, ctaHref, className } = props;
        const navItems = items?.map((item: any) =>
            `<a href="${item.href}" class="text-gray-600 hover:text-indigo-600 font-medium transition">${item.label}</a>`
        ).join('') || '';

        return `
<nav class="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 ${className || ''}">
    <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-8">
            <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">${logoText || 'Logo'}</span>
            <div class="hidden md:flex items-center gap-6">${navItems}</div>
        </div>
        ${ctaText ? `<a href="${ctaHref || '#'}" class="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">${ctaText}</a>` : ''}
    </div>
</nav>`;
    }

    if (type === 'BuilderCard') {
        const { title, description, imageSrc, buttonText, buttonHref, className } = props;
        return `
<div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 ${className || ''}">
    ${imageSrc ? `<img src="${imageSrc}" alt="${title || 'Card image'}" class="w-full h-48 object-cover" />` : ''}
    <div class="p-6">
        ${title ? `<h3 class="text-xl font-bold text-gray-900 mb-2">${title}</h3>` : ''}
        ${description ? `<p class="text-gray-500 mb-6 line-clamp-3">${description}</p>` : ''}
        ${buttonText ? `<a href="${buttonHref || '#'}" class="text-indigo-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all">${buttonText} <span>→</span></a>` : ''}
    </div>
</div>`;
    }

    if (type === 'BuilderFooter') {
        const { logoText, description, footerColumns, copyright, className } = props;
        const columns = footerColumns?.map((col: any) => `
            <div>
                <h4 class="font-bold text-gray-900 mb-4">${col.title}</h4>
                <ul class="space-y-2">
                    ${col.links?.map((link: any) => `<li><a href="${link.href}" class="text-gray-500 hover:text-indigo-600 transition text-sm">${link.label}</a></li>`).join('')}
                </ul>
            </div>
        `).join('') || '';

        return `
<footer class="bg-gray-50 pt-20 pb-10 border-t border-gray-100 ${className || ''}">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div class="md:col-span-1">
            <span class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4 block">${logoText || 'Logo'}</span>
            <p class="text-gray-500 text-sm leading-relaxed">${description || ''}</p>
        </div>
        ${columns}
    </div>
    <div class="max-w-7xl mx-auto px-6 pt-10 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-gray-400 text-xs">${copyright || `© ${new Date().getFullYear()} ${logoText || 'Company'}. All rights reserved.`}</p>
    </div>
</footer>`;
    }

    // --- Layout Elements ---

    if (type === 'BuilderGrid') {
        const { columns, gap, className } = props;
        const colClass = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 md:grid-cols-2' : columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
        const gapPx = gap || '24px';
        const childrenHtml = children?.map(componentNodeToHtml).join('') || '';
        return `<div class="grid ${colClass} ${className || ''}" style="gap: ${gapPx}">${childrenHtml}</div>`;
    }

    if (type === 'BuilderRow') {
        const { justify, align, gap, className } = props;
        const justifyMap: any = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' };
        const alignMap: any = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' };
        const childrenHtml = children?.map(componentNodeToHtml).join('') || '';
        return `<div class="flex flex-row ${justifyMap[justify || 'start']} ${alignMap[align || 'center']} ${className || ''}" style="gap: ${gap || '16px'}">${childrenHtml}</div>`;
    }

    if (type === 'BuilderColumn') {
        const { justify, align, gap, className } = props;
        const justifyMap: any = { start: 'justify-start', center: 'justify-center', end: 'justify-end', 'between': 'justify-between' };
        const alignMap: any = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' };
        const childrenHtml = children?.map(componentNodeToHtml).join('') || '';
        return `<div class="flex flex-col ${justifyMap[justify || 'start']} ${alignMap[align || 'stretch']} ${className || ''}" style="gap: ${gap || '16px'}">${childrenHtml}</div>`;
    }

    // --- Atomic Elements ---

    let tagName = 'div';
    if (type === 'BuilderText') {
        tagName = props.tag || 'p';
    } else if (type === 'BuilderButton') {
        tagName = 'a';
    } else if (type === 'BuilderImage') {
        tagName = 'img';
    } else if (type === 'BuilderLink') {
        tagName = 'a';
    } else if (type === 'CustomHTML') {
        return `<div class="${props.className || ''}">${props.code || ''}</div>`;
    } else if (type === 'BuilderDivider') {
        return `<hr class="border-none h-px bg-gray-200 my-4 ${props.className || ''}" />`;
    }

    // Construct attributes
    const attributes: string[] = [];
    if ('className' in props && props.className) attributes.push(`class="${props.className}"`);
    if ('href' in props && props.href) attributes.push(`href="${props.href}"`);
    if ('src' in props && props.src) attributes.push(`src="${props.src}"`);
    if ('alt' in props && props.alt) attributes.push(`alt="${props.alt}"`);
    if ('target' in props && props.target) attributes.push(`target="${props.target}"`);

    // Add default button styles if none provided
    if (type === 'BuilderButton' && (!props.className || !props.className.includes('px-'))) {
        const baseBtn = "inline-block px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition";
        if (attributes[0]?.startsWith('class="')) {
            attributes[0] = `class="${baseBtn} ${props.className}"`;
        } else {
            attributes.push(`class="${baseBtn}"`);
        }
    }

    const attrStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';

    if (tagName === 'img') {
        return `<img${attrStr} />`;
    }

    let childrenHtml = '';
    if ('text' in props && props.text) {
        childrenHtml += props.text;
    }

    if (children && children.length > 0) {
        childrenHtml += children.map(componentNodeToHtml).join('');
    }

    return `<${tagName}${attrStr}>${childrenHtml}</${tagName}>`;
}

export function sectionsToHtml(sections: ComponentNode[]): string {
    const bodyContent = sections.map(componentNodeToHtml).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white min-h-screen flex flex-col">
${bodyContent}
</body>
</html>`;
}
