import {
    BuilderText,
    BuilderButton,
    BuilderImage,
    BuilderContainer,
    BuilderLink,
    BuilderVideo,
    BuilderDivider,
    BuilderSpacer
} from '@/components/builder/atoms';
import {
    BuilderRow,
    BuilderColumn,
    BuilderGrid
} from '@/components/builder/layout';
import {
    BuilderCard,
    BuilderHero,
    BuilderNavbar,
    BuilderFooter
} from '@/components/builder/blocks';
import { CustomHTML } from '@/components/builder/special/CustomHTML';
import { parseTailwindClasses } from '@/lib/builder/tailwindParser';
import { nanoid } from 'nanoid';

// Craft.js 节点数据结构
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

// 扁平化的 Craft.js 数据集
type CraftData = Record<string, CraftNodeData>;

// 创建一个新的节点 ID
const createId = () => nanoid(10);

const getComponentName = (component: any) => {
    return component.craft?.displayName || component.name || 'CustomHTML';
};

/**
 * 将 HTML 字符串转换为 Craft.js 兼容的 JSON 数据
 */
export const htmlToCraftData = (html: string): string => {
    if (typeof window === 'undefined') {
        return JSON.stringify({
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
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    const craftData: CraftData = {
        ROOT: {
            type: { resolvedName: 'BuilderContainer' },
            isCanvas: true,
            props: { className: 'w-full min-h-screen bg-white' }, // Body 样式
            displayName: 'Body',
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {}
        }
    };

    // 递归处理 DOM 节点
    const processNode = (domNode: Element, parentId: string) => {
        const nodeId = createId();
        const tagName = domNode.tagName.toLowerCase();
        let component: any = BuilderContainer; // 默认容器
        
        const rawClass = domNode.getAttribute('class') || '';
        const { props: styleProps, remainingClasses } = parseTailwindClasses(rawClass);
        
        let props: any = { 
            ...styleProps,
            className: remainingClasses 
        };
        
        let shouldProcessChildren = true;

        // --- 1. 语义化区块识别 ---
        if (tagName === 'nav') {
            component = BuilderNavbar;
            props.logoText = domNode.querySelector('.logo, .brand, h1')?.textContent || 'Brand';
            shouldProcessChildren = false; // Navbar 通常是自包含的
        } else if (tagName === 'footer') {
            component = BuilderFooter;
            shouldProcessChildren = false;
        } else if (tagName === 'section' && (rawClass.includes('hero') || domNode.id === 'hero')) {
            component = BuilderHero;
            props.title = domNode.querySelector('h1')?.textContent || 'Welcome';
            props.description = domNode.querySelector('p')?.textContent || '';
            shouldProcessChildren = false;
        } else if (rawClass.includes('card') || rawClass.includes('shadow')) {
            const img = domNode.querySelector('img');
            const title = domNode.querySelector('h3, h4, strong');
            if (img && title) {
                component = BuilderCard;
                props.imageSrc = img.getAttribute('src');
                props.title = title.textContent;
                props.description = domNode.querySelector('p')?.textContent;
                props.buttonText = domNode.querySelector('a, button')?.textContent;
                shouldProcessChildren = false;
            }
        }

        // --- 2. 基础元素识别 (如果未被识别为区块) ---
        if (component === BuilderContainer) {
            switch (tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    component = BuilderText;
                    props.text = domNode.textContent;
                    props.tag = tagName;
                    shouldProcessChildren = false;
                    break;

                case 'p':
                case 'span':
                    if (domNode.children.length === 0) {
                        component = BuilderText;
                        props.text = domNode.textContent;
                        props.tag = tagName;
                        shouldProcessChildren = false;
                    }
                    break;

                case 'a':
                    component = BuilderLink;
                    props.text = domNode.textContent || 'Link';
                    props.href = domNode.getAttribute('href') || '#';
                    props.target = domNode.getAttribute('target') || '_self';
                    shouldProcessChildren = false;
                    break;

                case 'button':
                    component = BuilderButton;
                    props.text = domNode.textContent || 'Button';
                    shouldProcessChildren = false;
                    break;

                case 'img':
                    component = BuilderImage;
                    props.src = domNode.getAttribute('src') || '';
                    props.alt = domNode.getAttribute('alt') || '';
                    shouldProcessChildren = false;
                    break;

                case 'video':
                    component = BuilderVideo;
                    props.src = domNode.getAttribute('src') || '';
                    shouldProcessChildren = false;
                    break;

                case 'hr':
                    component = BuilderDivider;
                    shouldProcessChildren = false;
                    break;

                // --- 3. 布局元素识别 ---
                case 'div':
                case 'section':
                case 'main':
                case 'header':
                    if (rawClass.includes('flex') && !rawClass.includes('flex-col')) {
                        component = BuilderRow;
                    } else if (rawClass.includes('flex-col')) {
                        component = BuilderColumn;
                    } else if (rawClass.includes('grid')) {
                        component = BuilderGrid;
                        // Parse grid columns
                        const gridColsMatch = rawClass.match(/grid-cols-(\d+)/);
                        if (gridColsMatch) {
                            props.columns = parseInt(gridColsMatch[1], 10);
                        }
                        // Gap is handled by styleProps (if we add gap support there) or we parse it here
                        const gapMatch = rawClass.match(/gap-(\d+)/);
                        if (gapMatch) {
                            // map gap-4 to 16px
                             const gapVal = parseInt(gapMatch[1]) * 4; // Approximate: tailwind unit * 4px
                             props.gap = `${gapVal}px`;
                        }
                    }
                    break;

                case 'ul':
                case 'ol':
                    component = BuilderColumn;
                    break;
            }
        }

        // 创建节点数据
        craftData[nodeId] = {
            type: { resolvedName: getComponentName(component) },
            isCanvas: true,
            props,
            displayName: getComponentName(component),
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {},
            parent: parentId
        };

        // 添加到父节点的 nodes 列表
        craftData[parentId].nodes.push(nodeId);

        // 递归处理子节点
        if (shouldProcessChildren) {
            Array.from(domNode.children).forEach(child => processNode(child, nodeId));
        }
    };

    // 开始从 body 的直接子元素处理
    Array.from(body.children).forEach(child => processNode(child, 'ROOT'));

    return JSON.stringify(craftData);
};
