import { BuilderData, BuilderNode } from './parser-server';
import { getBuilderClassNames, getBuilderStyles, BuilderStyleProps } from './styleUtils';

// Helper to convert React CSSProperties to inline style string
const styleObjectToString = (style: React.CSSProperties): string => {
    return Object.entries(style)
        .map(([key, value]) => {
            // Convert camelCase to kebab-case
            const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
            return `${kebabKey}:${value}`;
        })
        .join(';');
};

export function generateHtmlFromBuilderData(data: BuilderData): string {
    const rootId = 'ROOT';
    if (!data[rootId]) return '';

    return processNode(rootId, data);
}

function processNode(nodeId: string, data: BuilderData): string {
    const node = data[nodeId];
    if (!node) return '';

    // Specialized handling based on component type
    const handlers: Record<string, (node: BuilderNode, data: BuilderData) => string> = {
        'BuilderContainer': generateContainer,
        'BuilderText': generateText,
        'BuilderButton': generateButton,
        'BuilderImage': generateImage,
        'BuilderLink': generateLink,
        'BuilderVideo': generateVideo,
        'CustomHTML': generateCustomHTML
    };

    const handler = handlers[node.type.resolvedName] || generateContainer;
    return handler(node, data);
}

function getCommonAttributes(node: BuilderNode): string {
    const props = node.props as BuilderStyleProps;
    // We assume 'desktop' as default for static HTML generation
    const className = getBuilderClassNames(props, node.props.className || '', 'desktop');
    const style = getBuilderStyles(props, 'desktop');

    // Add textDecoration if present in props root (often handled specially in BuilderLink/Text)
    if (props.textDecoration) {
        style.textDecoration = props.textDecoration;
    }

    const styleString = styleObjectToString(style);

    let attrs = `class="${className}"`;
    if (styleString) {
        attrs += ` style="${styleString}"`;
    }
    return attrs;
}

function generateContainer(node: BuilderNode, data: BuilderData): string {
    const attrs = getCommonAttributes(node);
    const tagName = node.props.tagName || 'div'; // Fallback if supported

    const children = node.nodes.map(childId => processNode(childId, data)).join('');

    return `<${tagName} ${attrs}>${children}</${tagName}>`;
}

function generateText(node: BuilderNode, data: BuilderData): string {
    const attrs = getCommonAttributes(node);
    const tagName = node.props.tagName || 'p';
    const text = node.props.text || '';

    return `<${tagName} ${attrs}>${text}</${tagName}>`;
}

function generateButton(node: BuilderNode, data: BuilderData): string {
    const attrs = getCommonAttributes(node);
    const text = node.props.text || 'Button';
    const href = node.props.href;

    if (href) {
        return `<a href="${href}" ${attrs}>${text}</a>`;
    }
    return `<button ${attrs}>${text}</button>`;
}

function generateLink(node: BuilderNode, data: BuilderData): string {
    const attrs = getCommonAttributes(node);
    const href = node.props.href || '#';
    const target = node.props.target || '_self';
    const rel = target === '_blank' ? ' rel="noopener noreferrer"' : '';
    const text = node.props.text || ''; // Fallback text

    // Children take precedence over text, but we render both logic if children exist
    const childrenHtml = node.nodes.map(childId => processNode(childId, data)).join('');
    const content = childrenHtml || text;

    return `<a href="${href}" target="${target}"${rel} ${attrs}>${content}</a>`;
}

function generateImage(node: BuilderNode, data: BuilderData): string {
    const attrs = getCommonAttributes(node);
    const src = node.props.src || '';
    const alt = node.props.alt || '';

    return `<img src="${src}" alt="${alt}" ${attrs} />`;
}

function generateVideo(node: BuilderNode, data: BuilderData): string {
    const attrs = getCommonAttributes(node);
    const url = node.props.url || '';

    // Simple video tag support. 
    // If it's a youtube/vimeo structure, it might need iframe generation logic depending on how BuilderVideo stored it.
    // Assuming simple HTML5 video or source src for now based on parser.
    return `<video src="${url}" controls ${attrs}></video>`;
}

function generateCustomHTML(node: BuilderNode, data: BuilderData): string {
    return node.props.code || '';
}
