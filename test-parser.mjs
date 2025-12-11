// Test script to verify the parser-server works correctly
import { nanoid } from 'nanoid';
import * as cheerio from 'cheerio';

// Minimal test HTML (similar to AI-generated content)
const testHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white min-h-screen">
    <nav class="flex items-center justify-between p-4 bg-gray-800">
        <a href="/" class="text-white font-bold">Brand</a>
        <div class="flex gap-4">
            <a href="/about" class="text-white hover:text-gray-300">About</a>
            <a href="/contact" class="text-white hover:text-gray-300">Contact</a>
        </div>
    </nav>
    <section class="py-20 text-center">
        <h1 class="text-4xl font-bold mb-4">Welcome to My Site</h1>
        <p class="text-gray-600 mb-8">This is a test page for the parser.</p>
        <button class="bg-blue-500 text-white px-6 py-3 rounded">Get Started</button>
    </section>
    <div class="grid grid-cols-3 gap-4 p-8">
        <div class="p-4 bg-gray-100 rounded shadow">
            <h3 class="font-bold">Card 1</h3>
            <p>Description 1</p>
        </div>
        <div class="p-4 bg-gray-100 rounded shadow">
            <h3 class="font-bold">Card 2</h3>
            <p>Description 2</p>
        </div>
        <div class="p-4 bg-gray-100 rounded shadow">
            <h3 class="font-bold">Card 3</h3>
            <p>Description 3</p>
        </div>
    </div>
    <footer class="bg-gray-800 text-white p-8 text-center">
        <p>&copy; 2024 My Site</p>
    </footer>
</body>
</html>`;

// Simplified parser for testing
function parseTailwindClasses(className) {
    return { props: {}, remainingClasses: className };
}

function parseHtmlToBuilderJson(html) {
    console.log('[Parser] Starting HTML to Builder JSON conversion, input length:', html.length);

    const $ = cheerio.load(html);
    const body = $('body');
    const ROOT_NODE_ID = 'ROOT';

    const builderData = {};

    builderData[ROOT_NODE_ID] = {
        id: ROOT_NODE_ID,
        type: { resolvedName: 'BuilderContainer' },
        props: { className: 'w-full min-h-screen' },
        nodes: [],
        linkedNodes: {},
        isCanvas: true,
        hidden: false,
        displayName: 'Page',
    };

    function processNode(node, parentId) {
        if (node.type === 'text') {
            const textContent = node.data?.trim() || '';
            if (!textContent) return null;

            const id = nanoid();
            builderData[id] = {
                id,
                type: { resolvedName: 'BuilderText' },
                props: { text: textContent, tag: 'span' },
                nodes: [],
                parent: parentId,
                hidden: false,
                displayName: 'Text'
            };
            return id;
        }

        if (node.type === 'comment') return null;

        if (node.type === 'tag') {
            const el = $(node);
            const tagName = node.name.toLowerCase();
            const className = el.attr('class') || '';

            if (tagName === 'script' || tagName === 'style') {
                return null; // Skip for testing
            }

            const id = nanoid();
            let resolvedName = 'BuilderContainer';
            let props = { className };

            // Detection logic
            if (tagName === 'nav') {
                resolvedName = 'BuilderNavbar';
            } else if (tagName === 'footer') {
                resolvedName = 'BuilderFooter';
            } else if (tagName === 'button') {
                resolvedName = 'BuilderButton';
                props.text = el.text().trim();
            } else if (tagName === 'a') {
                resolvedName = 'BuilderLink';
                props.text = el.text().trim();
                props.href = el.attr('href');
            } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName)) {
                if (!node.children || node.children.every(c => c.type === 'text')) {
                    resolvedName = 'BuilderText';
                    props.text = el.text().trim();
                    props.tag = tagName;
                }
            } else if (tagName === 'img') {
                resolvedName = 'BuilderImage';
                props.src = el.attr('src');
            } else if (className.includes('grid')) {
                resolvedName = 'BuilderGrid';
            } else if (className.includes('flex')) {
                resolvedName = 'BuilderRow';
            }

            builderData[id] = {
                id,
                type: { resolvedName },
                props,
                nodes: [],
                parent: parentId,
                hidden: false,
                isCanvas: resolvedName.includes('Container') || resolvedName.includes('Grid') || resolvedName.includes('Row') || resolvedName.includes('Navbar') || resolvedName.includes('Footer'),
                displayName: resolvedName.replace('Builder', '')
            };

            // Process children
            if (!['BuilderText', 'BuilderButton', 'BuilderImage', 'BuilderLink'].includes(resolvedName)) {
                el.contents().each((_, child) => {
                    const childId = processNode(child, id);
                    if (childId) {
                        builderData[id].nodes.push(childId);
                    }
                });
            }

            return id;
        }

        return null;
    }

    body.contents().each((_, node) => {
        const childId = processNode(node, ROOT_NODE_ID);
        if (childId) {
            builderData[ROOT_NODE_ID].nodes.push(childId);
        }
    });

    console.log('[Parser] Conversion complete, total nodes:', Object.keys(builderData).length);
    return builderData;
}

// Run test
console.log('=== Testing Parser ===\n');
const result = parseHtmlToBuilderJson(testHtml);

console.log('\n=== Result Summary ===');
console.log('Total nodes:', Object.keys(result).length);
console.log('ROOT children:', result.ROOT.nodes.length);

console.log('\n=== Node Types ===');
const typeCounts = {};
for (const [id, node] of Object.entries(result)) {
    const type = node.type.resolvedName;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
}
console.log(typeCounts);

console.log('\n=== ROOT Structure ===');
function printTree(nodeId, indent = 0) {
    const node = result[nodeId];
    const prefix = '  '.repeat(indent);
    console.log(`${prefix}- ${node.type.resolvedName} (${nodeId.substring(0, 6)}...) ${node.props.text ? `"${node.props.text.substring(0, 20)}..."` : ''}`);
    for (const childId of node.nodes || []) {
        printTree(childId, indent + 1);
    }
}
printTree('ROOT');

console.log('\n=== Full JSON (first 3 nodes) ===');
const entries = Object.entries(result).slice(0, 3);
console.log(JSON.stringify(Object.fromEntries(entries), null, 2));
