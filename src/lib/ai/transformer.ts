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

    // Create Root Node (Canvas)
    // We assume the top level component from AI is a Container that acts as the section wrapper
    // But Craft.js needs a ROOT node. 
    // If we are appending to an existing page, we might need to handle this differently.
    // For now, let's assume we are generating a FULL page or a single section that we want to load.
    // If we load a single section, we might want to wrap it in a ROOT Canvas.

    const rootId = 'ROOT';

    nodes[rootId] = {
        type: { resolvedName: 'BuilderContainer' },
        isCanvas: true,
        props: { className: 'w-full min-h-screen bg-white p-8 flex flex-col gap-4' }, // Default root props
        displayName: 'BuilderContainer',
        custom: {},
        hidden: false,
        nodes: [],
        linkedNodes: {},
    };

    // Helper to traverse and add nodes
    function traverse(node: ComponentNode, parentId: string) {
        const id = nanoid(10); // Generate short ID

        // Add ID to parent's nodes
        if (nodes[parentId]) {
            nodes[parentId].nodes.push(id);
        }

        // Create the node
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

        // Recursively add children
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => traverse(child, id));
        }
    }

    // If the input tree is a list of sections (from our loop), we should add them all to ROOT.
    // But the transformer input is a single ComponentNode (root of the tree).
    // If we have multiple sections, we should probably wrap them in a parent Container before calling this,
    // OR we modify this to accept an array.

    // Let's assume the AI returns a single "Section" component which is a BuilderContainer.
    // We will add this "Section" as a child of ROOT.

    traverse(componentTree, rootId);

    return JSON.stringify(nodes);
}

// Function to merge multiple sections into one Craft JSON
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
