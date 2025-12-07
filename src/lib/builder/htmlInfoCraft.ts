import { parseTailwindClasses } from '@/lib/builder/tailwindParser';
import { nanoid } from 'nanoid';

// Craft.js Node Data Structure
interface CraftNodeData {
    type: { resolvedName: string };
    isCanvas: boolean;
    props: any;
    displayName: string;
    custom: any;
    hidden: boolean;
    nodes: string[];
    linkedNodes: any;
    parent?: string;
}

// Flat Craft.js Data Set
type CraftData = Record<string, CraftNodeData>;

// Create new node ID
const createId = () => nanoid(10);

/**
 * Convert HTML string to Craft.js compatible JSON data
 */
export const htmlToCraftData = (html: string): string => {
    // Default empty state
    const defaultState = JSON.stringify({
        ROOT: {
            type: { resolvedName: 'BuilderContainer' },
            isCanvas: true,
            props: { className: 'w-full min-h-screen bg-white p-4' },
            displayName: 'Body',
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {}
        }
    });

    if (typeof window === 'undefined') {
        return defaultState;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    const craftData: CraftData = {
        ROOT: {
            type: { resolvedName: 'BuilderContainer' },
            isCanvas: true,
            props: { className: 'w-full min-h-screen bg-white' }, // Body style
            displayName: 'Body',
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {}
        }
    };

    // Recursively process DOM nodes
    const processNode = (domNode: Element, parentId: string, depth: number = 0) => {
        if (depth > 50) {
            console.warn('Max recursion depth reached in htmlToCraftData');
            return;
        }

        try {
            const nodeId = createId();
            const tagName = domNode.tagName ? domNode.tagName.toLowerCase() : 'div';

            // Default component
            let resolvedName = 'BuilderContainer'; // Default container

            // Extract classes for analysis
            const rawClass = domNode.getAttribute('class') || '';
            const { props: styleProps, remainingClasses } = parseTailwindClasses(rawClass);

            let props: any = {
                ...styleProps,
                className: remainingClasses
            };

            let shouldProcessChildren = true;

            // --- 1. Semantic Block Identification ---
            if (tagName === 'nav') {
                resolvedName = 'BuilderNavbar';
                props.logoText = domNode.querySelector('.logo, .brand, h1')?.textContent || 'Brand';
                shouldProcessChildren = false;
            } else if (tagName === 'footer') {
                resolvedName = 'BuilderFooter';
                shouldProcessChildren = false;
            } else if (tagName === 'section' && (rawClass.includes('hero') || domNode.id === 'hero')) {
                resolvedName = 'BuilderHero';
                props.title = domNode.querySelector('h1')?.textContent || 'Welcome';
                props.description = domNode.querySelector('p')?.textContent || '';
                shouldProcessChildren = false;
            } else if (rawClass.includes('card') || rawClass.includes('shadow')) {
                const img = domNode.querySelector('img');
                const title = domNode.querySelector('h3, h4, strong');
                if (img && title) {
                    resolvedName = 'BuilderCard';
                    props.imageSrc = img.getAttribute('src');
                    props.title = title.textContent;
                    props.description = domNode.querySelector('p')?.textContent;
                    props.buttonText = domNode.querySelector('a, button')?.textContent;
                    shouldProcessChildren = false;
                }
            }

            // --- 2. Basic Element Identification ---
            // Only if not already identified as a complex block
            if (resolvedName === 'BuilderContainer') {
                switch (tagName) {
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        resolvedName = 'BuilderText';
                        props.text = domNode.textContent;
                        props.tag = tagName;
                        shouldProcessChildren = false;
                        break;
                    case 'p':
                    case 'span':
                        if (domNode.children.length === 0) {
                            resolvedName = 'BuilderText';
                            props.text = domNode.textContent;
                            props.tag = tagName;
                            shouldProcessChildren = false;
                        }
                        break;
                    case 'a':
                        resolvedName = 'BuilderLink';
                        props.text = domNode.textContent || 'Link';
                        props.href = domNode.getAttribute('href') || '#';
                        props.target = domNode.getAttribute('target') || '_self';
                        shouldProcessChildren = false;
                        break;
                    case 'button':
                        resolvedName = 'BuilderButton';
                        props.text = domNode.textContent || 'Button';
                        shouldProcessChildren = false;
                        break;
                    case 'img':
                        resolvedName = 'BuilderImage';
                        props.src = domNode.getAttribute('src') || '';
                        props.alt = domNode.getAttribute('alt') || '';
                        shouldProcessChildren = false;
                        break;
                    case 'video':
                        resolvedName = 'BuilderVideo';
                        props.src = domNode.getAttribute('src') || '';
                        shouldProcessChildren = false;
                        break;
                    case 'hr':
                        resolvedName = 'BuilderDivider';
                        shouldProcessChildren = false;
                        break;
                    case 'div':
                    case 'section':
                    case 'main':
                    case 'header':
                        if (rawClass.includes('flex') && !rawClass.includes('flex-col')) {
                            resolvedName = 'BuilderRow';
                        } else if (rawClass.includes('flex-col')) {
                            resolvedName = 'BuilderColumn';
                        } else if (rawClass.includes('grid')) {
                            resolvedName = 'BuilderGrid';
                            const gridColsMatch = rawClass.match(/grid-cols-(\d+)/);
                            if (gridColsMatch) props.columns = parseInt(gridColsMatch[1], 10);
                            const gapMatch = rawClass.match(/gap-(\d+)/);
                            if (gapMatch) props.gap = `${parseInt(gapMatch[1]) * 4}px`;
                        } else {
                            // Default to BuilderContainer
                            resolvedName = 'BuilderContainer';
                        }
                        break;
                    case 'ul':
                    case 'ol':
                        resolvedName = 'BuilderColumn';
                        break;
                    default:
                        // For unknown tags, stay as BuilderContainer
                        resolvedName = 'BuilderContainer';
                }
            }

            // Create node data
            craftData[nodeId] = {
                type: { resolvedName },
                isCanvas: true,
                props,
                displayName: resolvedName,
                custom: {},
                hidden: false,
                nodes: [],
                linkedNodes: {},
                parent: parentId
            };

            // Add to parent's nodes list
            if (craftData[parentId]) {
                craftData[parentId].nodes.push(nodeId);
            }

            // Recursively process children
            if (shouldProcessChildren) {
                Array.from(domNode.children).forEach(child => processNode(child, nodeId, depth + 1));
            }

        } catch (e) {
            console.error("Error processing node:", domNode, e);
        }
    };

    // Start processing from body children
    try {
        Array.from(body.children).forEach(child => processNode(child, 'ROOT', 0));
    } catch (e) {
        console.error("Error in htmlToCraftData main loop:", e);
    }

    return JSON.stringify(craftData);
};
