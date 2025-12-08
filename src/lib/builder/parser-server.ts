import { JSDOM } from 'jsdom';
import { nanoid } from 'nanoid';

// Type definitions for Builder Data (lighter version of Craft.js state)
export interface BuilderNode {
    id: string;
    type: {
        resolvedName: string;
    };
    props: Record<string, any>;
    nodes: string[]; // Child IDs
    parent?: string;
    displayName?: string;
    hidden: boolean;
    isCanvas?: boolean;
    linkedNodes?: Record<string, string>;
}

export interface BuilderData {
    [key: string]: BuilderNode;
}

const ROOT_NODE_ID = 'ROOT';

export async function parseHtmlToBuilderJson(html: string): Promise<BuilderData> {
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const body = doc.body;

    const builderData: BuilderData = {};

    // Initialize ROOT node (BuilderContainer)
    builderData[ROOT_NODE_ID] = {
        id: ROOT_NODE_ID,
        type: { resolvedName: 'BuilderContainer' },
        props: {
            className: 'w-full min-h-screen bg-white',
            padding: { top: '0', bottom: '0', left: '0', right: '0' },
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
        },
        nodes: [],
        linkedNodes: {},
        isCanvas: true,
        hidden: false,
        displayName: 'Page',
    };

    // Process children of body and attach to ROOT
    // We filter out script tags and empty text nodes at the top level usually, 
    // but our recursive function handles node types.

    // Convert NodeList to Array
    const children = Array.from(body.childNodes);

    for (const child of children) {
        const childId = processNode(child, ROOT_NODE_ID, builderData);
        if (childId) {
            builderData[ROOT_NODE_ID].nodes.push(childId);
        }
    }

    return builderData;
}

function processNode(node: Node, parentId: string, builderData: BuilderData): string | null {
    // 1. Text Nodes
    if (node.nodeType === 3) { // TEXT_NODE
        const textContent = node.textContent?.trim();
        if (!textContent) return null; // Skip empty whitespace

        const id = nanoid();
        builderData[id] = {
            id,
            type: { resolvedName: 'BuilderText' },
            props: {
                text: textContent,
                tagName: 'span', // Default to span for raw text, context might change this
            },
            nodes: [],
            parent: parentId,
            hidden: false,
            displayName: 'Text'
        };
        return id;
    }

    // 1.5 Comments -> Ignore
    if (node.nodeType === 8) return null;

    // 2. Element Nodes
    if (node.nodeType === 1) { // ELEMENT_NODE
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        // -- Special Handling: Scripts/Styles -> Ignore or CustomHTML?
        // Project design says CustomHTML for preservation, but for now scripts in body might be dangerous/useless in builder.
        // Let's preserve complex stuff in CustomHTML, but skip strictly non-visual stuff if safe.
        if (tagName === 'script' || tagName === 'style') {
            // For "Zero Loss", we arguably should keep them, but in a UI builder, 
            // a random text node with script content is bad. 
            // Let's wrap in CustomHTML properly.
            return createCustomHTMLNode(el, parentId, builderData);
        }

        // -- ATOMIC FALLBACK STRATEGY --
        // We try to map to the most basic atomic component available.

        // A. Images
        if (tagName === 'img') {
            const id = nanoid();
            builderData[id] = {
                id,
                type: { resolvedName: 'BuilderImage' },
                props: {
                    src: el.getAttribute('src') || '',
                    alt: el.getAttribute('alt') || '',
                    className: el.className,
                    // Extract styles if needed, for now rely on Tailwind classes provided by AI
                },
                nodes: [],
                parent: parentId,
                hidden: false,
                displayName: 'Image'
            };
            return id;
        }

        // B. Buttons / Links (that look like buttons)
        if (tagName === 'button' || (tagName === 'a' && (el.className.includes('btn') || el.className.includes('button')))) {
            const id = nanoid();
            builderData[id] = {
                id,
                type: { resolvedName: 'BuilderButton' }, // Or BuilderLink if it's an A tag
                props: {
                    text: el.textContent?.trim() || 'Button',
                    href: el.getAttribute('href') || '#',
                    className: el.className,
                    variant: 'default', // We assume default, classes will override appearance
                },
                nodes: [],
                parent: parentId,
                hidden: false,
                displayName: 'Button'
            };
            return id;
        }

        // C. Links (Standard text links)
        if (tagName === 'a') {
            // Standard link wrapper
            // If it contains children, we use BuilderLink which acts as a container
            return createContainerNode('BuilderLink', el, parentId, builderData, {
                href: el.getAttribute('href') || '#'
            });
        }

        // D. Text Headers / Paragraphs
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'blockquote'].includes(tagName)) {
            // Check if it has only text children
            if (hasOnlyTextChildren(el)) {
                const id = nanoid();
                builderData[id] = {
                    id,
                    type: { resolvedName: 'BuilderText' },
                    props: {
                        text: el.textContent?.trim() || '',
                        tagName: tagName,
                        className: el.className,
                    },
                    nodes: [],
                    parent: parentId,
                    hidden: false,
                    displayName: tagName.toUpperCase()
                };
                return id;
            }
            // If it has children (e.g. <h1><span>Highlight</span> Title</h1>), 
            // we treat it as a container to preserve structure? 
            // BuilderText doesn't support children.
            // So we must convert it to a BuilderContainer (div) that *looks* like the tag, 
            // OR we just assume BuilderContainer can render as other tags?
            // Checking BuilderContainer... usually strictly <div>.
            // Fallback: If strict 'atomic' is text-only, and we have mixed content, 
            // we treat it as a Container.
            // But <h1><div>...</div></h1> is invalid HTML5. 
            // Let's assume for now we use BuilderContainer with `className` preserving visual text styles.
            return createContainerNode('BuilderContainer', el, parentId, builderData);
        }

        // E. Inputs / Forms -> CustomHTML (Too complex for simple atoms right now)
        if (['input', 'select', 'textarea', 'form', 'label'].includes(tagName)) {
            return createCustomHTMLNode(el, parentId, builderData);
        }

        // F. Media (Video, Audio, Canvas, SVG)
        if (['video', 'audio', 'canvas', 'svg', 'iframe'].includes(tagName)) {
            if (tagName === 'video') {
                // Try to map to BuilderVideo if simple
                const src = el.getAttribute('src') || el.querySelector('source')?.getAttribute('src');
                if (src) {
                    const id = nanoid();
                    builderData[id] = {
                        id,
                        type: { resolvedName: 'BuilderVideo' },
                        props: {
                            url: src,
                            className: el.className
                        },
                        nodes: [],
                        parent: parentId,
                        hidden: false,
                        displayName: 'Video'
                    };
                    return id;
                }
            }
            return createCustomHTMLNode(el, parentId, builderData);
        }

        // G. Default Containers (div, section, main, header, footer, etc.)
        return createContainerNode('BuilderContainer', el, parentId, builderData);
    }

    return null;
}

function createContainerNode(resolvedName: string, el: HTMLElement, parentId: string, builderData: BuilderData, extraProps: any = {}): string {
    const id = nanoid();

    // Initialize node
    builderData[id] = {
        id,
        type: { resolvedName },
        props: {
            className: el.className,
            padding: { top: '0', bottom: '0', left: '0', right: '0' },
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
            ...extraProps
        },
        nodes: [], // Will fill below
        parent: parentId,
        hidden: false,
        isCanvas: true, // Containers usually act as canvas
        displayName: el.tagName.toLowerCase()
    };

    // Process children
    const children = Array.from(el.childNodes);
    for (const child of children) {
        const childId = processNode(child, id, builderData);
        if (childId) {
            builderData[id].nodes.push(childId);
        }
    }

    return id;
}

function createCustomHTMLNode(el: HTMLElement, parentId: string, builderData: BuilderData): string {
    const id = nanoid();
    builderData[id] = {
        id,
        type: { resolvedName: 'CustomHTML' },
        props: {
            code: el.outerHTML, // Capture the full exact HTML
            className: '' // CustomHTML usually handles its own layout
        },
        nodes: [],
        parent: parentId,
        hidden: false,
        displayName: 'Custom HTML'
    };
    return id;
}

function hasOnlyTextChildren(el: HTMLElement): boolean {
    const children = Array.from(el.childNodes);
    return children.every(c => c.nodeType === 3); // Only text nodes
}
