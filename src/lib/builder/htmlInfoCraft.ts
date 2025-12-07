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
            const dataComponent = domNode.getAttribute('data-component');
            const { props: styleProps, remainingClasses } = parseTailwindClasses(rawClass);

            let props: any = {
                ...styleProps,
                className: remainingClasses
            };

            let shouldProcessChildren = true;

            // --- 0. Explicit Component Identification (via data-component) ---
            if (dataComponent) {
                resolvedName = dataComponent;
            }
            // --- 1. Advanced Heuristic Detection ---
            else {
                // Navbar Detection
                if (tagName === 'nav' || 
                    (tagName === 'header' && (rawClass.includes('fixed') || rawClass.includes('sticky'))) ||
                    (rawClass.includes('navbar') || rawClass.includes('nav-wrapper'))) {
                    resolvedName = 'BuilderNavbar';
                }
                // Footer Detection
                else if (tagName === 'footer' || rawClass.includes('footer')) {
                    resolvedName = 'BuilderFooter';
                }
                // Hero Detection
                else if ((tagName === 'section' || tagName === 'header' || tagName === 'div') && 
                         (rawClass.includes('hero') || 
                          (depth === 0 && domNode.querySelector('h1') && domNode.querySelector('button, a[class*="btn"], a[class*="bg-"]')))) {
                    resolvedName = 'BuilderHero';
                }
                // Card Detection (Must be inside a grid/flex container or have specific classes)
                else if (rawClass.includes('card') || 
                         (rawClass.includes('shadow') && rawClass.includes('border') && rawClass.includes('rounded') && domNode.querySelector('h3, h4, h5'))) {
                     resolvedName = 'BuilderCard';
                }
                // Grid/Layout Detection
                else if (rawClass.includes('grid')) {
                    resolvedName = 'BuilderGrid';
                }
                else if (rawClass.includes('flex') && rawClass.includes('flex-col')) {
                    resolvedName = 'BuilderColumn';
                }
                else if (rawClass.includes('flex')) {
                    resolvedName = 'BuilderRow';
                }
                // Form Elements & Tables (Map to CustomHTML for fidelity)
                else if (['form', 'input', 'textarea', 'select', 'label', 'table'].includes(tagName)) {
                    resolvedName = 'CustomHTML';
                    props.code = domNode.outerHTML;
                    shouldProcessChildren = false;
                }
                // Basic Element Detection
                else if (/^h[1-6]$/.test(tagName) || tagName === 'p' || tagName === 'span') {
                     // Check for complex children (block elements)
                     if (domNode.querySelectorAll('div, img, video, ul, ol, table, form').length > 0) {
                         // Contains block elements -> likely a container
                         resolvedName = 'BuilderContainer';
                     } else if (domNode.children.length > 0) {
                         // Contains only inline elements (b, i, strong, a, span) -> Rich Text
                         // Map to CustomHTML to preserve formatting
                         resolvedName = 'CustomHTML';
                         props.code = domNode.outerHTML;
                         shouldProcessChildren = false;
                     } else {
                         // Plain text
                         resolvedName = 'BuilderText';
                     }
                }
                else if (tagName === 'a') {
                    // Check if it looks like a button
                    const isBtn = rawClass.includes('btn') || 
                                  rawClass.includes('button') || 
                                  (rawClass.includes('bg-') && rawClass.includes('px-')) ||
                                  domNode.getAttribute('role') === 'button';
                                  
                    if (isBtn) {
                        resolvedName = 'BuilderButton';
                    } else {
                        resolvedName = 'BuilderLink';
                    }
                }
                else if (tagName === 'button') {
                    resolvedName = 'BuilderButton';
                }
                else if (tagName === 'img') {
                    resolvedName = 'BuilderImage';
                }
                else if (tagName === 'video') {
                    resolvedName = 'BuilderVideo';
                }
                else if (tagName === 'hr') {
                    resolvedName = 'BuilderDivider';
                }
                else if (tagName === 'ul' || tagName === 'ol') {
                    resolvedName = 'BuilderColumn'; // Treat lists as columns
                }
            }

            // --- 2. Prop Extraction based on Resolved Name ---
            if (resolvedName === 'BuilderNavbar') {
                props.logoText = domNode.querySelector('.logo, .brand, h1, span.font-bold')?.textContent || 'Brand';
                shouldProcessChildren = false; // TODO: Parse links into `items` prop if possible, for now simplify
            } 
            else if (resolvedName === 'BuilderFooter') {
                shouldProcessChildren = false; 
            } 
            else if (resolvedName === 'BuilderHero') {
                props.title = domNode.querySelector('h1')?.textContent || 'Welcome';
                props.description = domNode.querySelector('p')?.textContent || '';
                const btn = domNode.querySelector('button, a[class*="btn"], a[class*="bg-"]');
                if (btn) {
                    props.buttonText = btn.textContent;
                    props.buttonHref = btn.getAttribute('href');
                }
                shouldProcessChildren = false;
            } 
            else if (resolvedName === 'BuilderCard') {
                const img = domNode.querySelector('img');
                if (img) props.imageSrc = img.getAttribute('src');
                props.title = domNode.querySelector('h3, h4, h5, strong')?.textContent || 'Card Title';
                props.description = domNode.querySelector('p')?.textContent || '';
                const btn = domNode.querySelector('button, a');
                if (btn) {
                    props.buttonText = btn.textContent;
                    props.buttonHref = btn.getAttribute('href');
                }
                shouldProcessChildren = false;
            }
            else if (resolvedName === 'BuilderGrid') {
                const gridColsMatch = rawClass.match(/grid-cols-(\d+)/);
                if (gridColsMatch) props.columns = parseInt(gridColsMatch[1], 10);
                const gapMatch = rawClass.match(/gap-(\d+)/);
                if (gapMatch) props.gap = `${parseInt(gapMatch[1]) * 4}px`;
            }
            else if (resolvedName === 'BuilderText') {
                props.text = domNode.textContent;
                props.tag = tagName;
                shouldProcessChildren = false;
            }
            else if (resolvedName === 'BuilderLink') {
                props.text = domNode.textContent || 'Link';
                props.href = domNode.getAttribute('href') || '#';
                props.target = domNode.getAttribute('target') || '_self';
                shouldProcessChildren = false;
            }
            else if (resolvedName === 'BuilderButton') {
                props.text = domNode.textContent || 'Button';
                props.href = domNode.getAttribute('href'); // In case it was an <a> tag
                shouldProcessChildren = false;
            }
            else if (resolvedName === 'BuilderImage') {
                props.src = domNode.getAttribute('src') || '';
                props.alt = domNode.getAttribute('alt') || '';
                shouldProcessChildren = false;
            }
            else if (resolvedName === 'BuilderVideo') {
                props.src = domNode.getAttribute('src') || '';
                shouldProcessChildren = false;
            }
            else if (resolvedName === 'CustomHTML') {
                // props.code is already set
                shouldProcessChildren = false;
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
