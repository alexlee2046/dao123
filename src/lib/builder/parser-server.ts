import { nanoid } from 'nanoid';
import * as cheerio from 'cheerio';

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
    const $ = cheerio.load(html);
    const body = $('body');

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
    body.contents().each((_, node) => {
        const childId = processNode($, node, ROOT_NODE_ID, builderData);
        if (childId) {
            builderData[ROOT_NODE_ID].nodes.push(childId);
        }
    });

    return builderData;
}

// Using 'any' for node types to avoid cheerio/domhandler type complexity
function processNode($: ReturnType<typeof cheerio.load>, node: any, parentId: string, builderData: BuilderData): string | null {
    // 1. Text Nodes
    if (node.type === 'text') {
        const textContent = node.data?.trim() || '';
        if (!textContent) return null; // Skip empty whitespace

        const id = nanoid();
        builderData[id] = {
            id,
            type: { resolvedName: 'BuilderText' },
            props: {
                text: textContent,
                tagName: 'span', // Default to span for raw text
            },
            nodes: [],
            parent: parentId,
            hidden: false,
            displayName: 'Text'
        };
        return id;
    }

    // 1.5 Comments -> Ignore
    if (node.type === 'comment') return null;

    // 2. Element Nodes
    if (node.type === 'tag') {
        const el = $(node);
        const tagName = node.name.toLowerCase();

        // -- Special Handling: Scripts/Styles -> Ignore or CustomHTML?
        if (tagName === 'script' || tagName === 'style') {
            return createCustomHTMLNode($, node, parentId, builderData);
        }

        // -- ATOMIC FALLBACK STRATEGY --

        // A. Images
        if (tagName === 'img') {
            const id = nanoid();
            builderData[id] = {
                id,
                type: { resolvedName: 'BuilderImage' },
                props: {
                    src: el.attr('src') || '',
                    alt: el.attr('alt') || '',
                    className: el.attr('class') || '',
                },
                nodes: [],
                parent: parentId,
                hidden: false,
                displayName: 'Image'
            };
            return id;
        }

        // B. Buttons / Links (that look like buttons)
        const className = el.attr('class') || '';
        if (tagName === 'button' || (tagName === 'a' && (className.includes('btn') || className.includes('button')))) {
            const id = nanoid();
            builderData[id] = {
                id,
                type: { resolvedName: 'BuilderButton' },
                props: {
                    text: el.text().trim() || 'Button',
                    href: el.attr('href') || '#',
                    className: className,
                    variant: 'default',
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
            return createContainerNode($, 'BuilderLink', node, parentId, builderData, {
                href: el.attr('href') || '#'
            });
        }

        // D. Text Headers / Paragraphs
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'blockquote'].includes(tagName)) {
            // Check if it has only text children
            if (hasOnlyTextChildren(node)) {
                const id = nanoid();
                builderData[id] = {
                    id,
                    type: { resolvedName: 'BuilderText' },
                    props: {
                        text: el.text().trim() || '',
                        tagName: tagName,
                        className: className,
                    },
                    nodes: [],
                    parent: parentId,
                    hidden: false,
                    displayName: tagName.toUpperCase()
                };
                return id;
            }
            return createContainerNode($, 'BuilderContainer', node, parentId, builderData);
        }

        // E. Inputs / Forms -> CustomHTML (Too complex for simple atoms)
        if (['input', 'select', 'textarea', 'form', 'label'].includes(tagName)) {
            return createCustomHTMLNode($, node, parentId, builderData);
        }

        // F. Media (Video, Audio, Canvas, SVG)
        if (['video', 'audio', 'canvas', 'svg', 'iframe'].includes(tagName)) {
            if (tagName === 'video') {
                const src = el.attr('src') || el.find('source').attr('src');
                if (src) {
                    const id = nanoid();
                    builderData[id] = {
                        id,
                        type: { resolvedName: 'BuilderVideo' },
                        props: {
                            url: src,
                            className: className
                        },
                        nodes: [],
                        parent: parentId,
                        hidden: false,
                        displayName: 'Video'
                    };
                    return id;
                }
            }
            return createCustomHTMLNode($, node, parentId, builderData);
        }

        // G. Default Containers (div, section, main, header, footer, etc.)
        return createContainerNode($, 'BuilderContainer', node, parentId, builderData);
    }

    return null;
}

function createContainerNode($: ReturnType<typeof cheerio.load>, resolvedName: string, node: any, parentId: string, builderData: BuilderData, extraProps: any = {}): string {
    const id = nanoid();
    const el = $(node);
    const tagName = node.name?.toLowerCase() || 'div';

    // Initialize node
    builderData[id] = {
        id,
        type: { resolvedName },
        props: {
            className: el.attr('class') || '',
            padding: { top: '0', bottom: '0', left: '0', right: '0' },
            margin: { top: '0', bottom: '0', left: '0', right: '0' },
            ...extraProps
        },
        nodes: [], // Will fill below
        parent: parentId,
        hidden: false,
        isCanvas: true, // Containers usually act as canvas
        displayName: tagName
    };

    // Process children
    el.contents().each((_, child) => {
        const childId = processNode($, child, id, builderData);
        if (childId) {
            builderData[id].nodes.push(childId);
        }
    });

    return id;
}

function createCustomHTMLNode($: ReturnType<typeof cheerio.load>, node: any, parentId: string, builderData: BuilderData): string {
    const id = nanoid();
    const el = $(node);
    builderData[id] = {
        id,
        type: { resolvedName: 'CustomHTML' },
        props: {
            code: $.html(el), // Capture the full exact HTML
            className: ''
        },
        nodes: [],
        parent: parentId,
        hidden: false,
        displayName: 'Custom HTML'
    };
    return id;
}

function hasOnlyTextChildren(node: any): boolean {
    if (!node.children) return true;
    return node.children.every((c: any) => c.type === 'text');
}
