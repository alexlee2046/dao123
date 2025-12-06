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
    
    // Mapping Builder components to HTML tags
    let tagName = 'div';
    
    if (type === 'BuilderText') {
        tagName = props.tag || 'p';
    } else if (type === 'BuilderButton') {
        tagName = 'a';
    } else if (type === 'BuilderImage') {
        tagName = 'img';
    } else if (type === 'BuilderNavbar') {
        tagName = 'nav';
    } else if (type === 'BuilderFooter') {
        tagName = 'footer';
    } else if (type === 'BuilderLink') {
        tagName = 'a';
    } else if (type === 'CustomHTML') {
        // Special case: return raw code wrapped in div if needed, or just the code
        // But props.code is what we want. 
        // For simplicity, we wrap in a div.
        return `<div class="${props.className || ''}">${props.code || ''}</div>`;
    }

    // Construct attributes
    const attributes: string[] = [];
    if ('className' in props && props.className) attributes.push(`class="${props.className}"`);
    if ('href' in props && props.href) attributes.push(`href="${props.href}"`);
    if ('src' in props && props.src) attributes.push(`src="${props.src}"`);
    if ('alt' in props && props.alt) attributes.push(`alt="${props.alt}"`);
    
    const attrStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
    
    // Self-closing tags
    if (tagName === 'img' || tagName === 'br' || tagName === 'hr') {
        return `<${tagName}${attrStr} />`;
    }
    
    // Children content
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
