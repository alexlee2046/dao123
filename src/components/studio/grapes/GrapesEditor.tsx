import React, { useEffect, useRef, useCallback } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPluginForms from 'grapesjs-plugin-forms';
import 'grapesjs/dist/css/grapes.min.css';
import './grapes-overrides.css';

export interface GrapesEditorProps {
    /** HTML content to load into the editor */
    htmlContent: string;
    /** Callback when HTML content changes */
    onHtmlChange?: (html: string, css: string) => void;
    /** Callback when editor is ready */
    onEditorReady?: (editor: Editor) => void;
    /** Whether the editor is readonly */
    readonly?: boolean;
    /** Current preview device */
    previewDevice?: 'desktop' | 'tablet' | 'mobile';
}

export const GrapesEditor: React.FC<GrapesEditorProps> = ({
    htmlContent,
    onHtmlChange,
    onEditorReady,
    readonly = false,
    previewDevice = 'desktop'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const isInitializedRef = useRef(false);
    const lastHtmlRef = useRef<string>('');

    // Initialize editor
    useEffect(() => {
        if (!containerRef.current) return;
        if (isInitializedRef.current) {
            console.log('[GrapesEditor] Already initialized, skipping');
            return;
        }

        console.log('[GrapesEditor] Initializing editor...', {
            htmlLength: htmlContent?.length,
            htmlPreview: htmlContent?.substring(0, 50) + '...'
        });

        try {
            const editor = grapesjs.init({
                container: containerRef.current,
                // Force explicit height to ensure visibility
                height: '100%',
                width: '100%',
                fromElement: false,

                // Disable built-in storage
                storageManager: false,

                // Canvas config - inject Tailwind CSS and System Theme
                canvas: {
                    scripts: ['https://cdn.tailwindcss.com'],
                    styles: [
                        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
                        // Inject our System Design Tokens so the builder content matches the app
                        `
                        :root {
                            --radius: 0.75rem;
                            --background: oklch(0.985 0 0);
                            --foreground: oklch(0.145 0 0);
                            --card: oklch(1 0 0);
                            --card-foreground: oklch(0.145 0 0);
                            --popover: oklch(1 0 0);
                            --popover-foreground: oklch(0.145 0 0);
                            --primary: oklch(0.5 0.2 270);
                            --primary-foreground: oklch(0.985 0 0);
                            --secondary: oklch(0.97 0 0);
                            --secondary-foreground: oklch(0.205 0 0);
                            --muted: oklch(0.97 0 0);
                            --muted-foreground: oklch(0.556 0 0);
                            --accent: oklch(0.97 0 0);
                            --accent-foreground: oklch(0.205 0 0);
                            --destructive: oklch(0.577 0.245 27.325);
                            --border: oklch(0.922 0 0);
                            --input: oklch(0.922 0 0);
                            --ring: oklch(0.5 0.2 270);
                            --sidebar-primary: oklch(0.5 0.2 270);
                        }
                        html, body { 
                            min-height: 100%; 
                            margin: 0; 
                            padding: 0; 
                            font-family: "Inter", system-ui, sans-serif; 
                            -webkit-font-smoothing: antialiased; 
                            color: var(--foreground); 
                            background-color: #ffffff; /* Always white paper for the page */
                            line-height: 1.5; 
                        }
                        /* Scrollbar styling for component view */
                        ::-webkit-scrollbar { width: 5px; height: 5px; }
                        ::-webkit-scrollbar-track { background: transparent; }
                        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
                        ::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
                        `
                    ]
                },

                // Device manager for responsive preview
                deviceManager: {
                    devices: [
                        { name: 'Desktop', width: '' },
                        { name: 'Tablet', width: '768px', widthMedia: '992px' },
                        { name: 'Mobile', width: '375px', widthMedia: '480px' }
                    ]
                },

                // Internationalization
                i18n: {
                    locale: 'zh', // Default to Chinese
                    detectLocale: false,
                    localeFallback: 'en',
                    messages: {
                        zh: {
                            blockManager: {
                                labels: {
                                    // Basic
                                    'Text': '文本',
                                    'Link': '链接',
                                    'Image': '图片',
                                    'Video': '视频',
                                    'Map': '地图',
                                    'Link Block': '链接块',
                                    'Quote': '引语',
                                    'Text section': '文本段落',
                                    '1 Column': '单栏',
                                    '2 Columns': '双栏',
                                    '3 Columns': '三栏',
                                    '2 Columns 3/7': '双栏 3/7',
                                    // Forms
                                    'Form': '表单容器',
                                    'Input': '输入框',
                                    'Textarea': '多行文本',
                                    'Select': '下拉选择',
                                    'Button': '按钮',
                                    'Label': '标签',
                                    'Checkbox': '复选框',
                                    'Radio': '单选框'
                                },
                                categories: {
                                    'Basic': '基础组件',
                                    'Forms': '表单组件',
                                    'Extra': '扩展组件'
                                }
                            },
                            styleManager: {
                                sectors: {
                                    'general': '常规',
                                    'layout': '布局',
                                    'typography': '文字',
                                    'decorations': '装饰',
                                    'extra': '其他',
                                    'flex': 'Flex',
                                    'dimension': '尺寸'
                                },
                                properties: {
                                    'float': '浮动',
                                    'display': '显示模式',
                                    'position': '定位',
                                    'top': '上边距',
                                    'right': '右边距',
                                    'left': '左边距',
                                    'bottom': '下边距',
                                    'width': '宽度',
                                    'height': '高度',
                                    'max-width': '最大宽度',
                                    'min-height': '最小高度',
                                    'margin': '外边距 (Margin)',
                                    'padding': '内边距 (Padding)',
                                    'font-family': '字体',
                                    'font-size': '字号',
                                    'font-weight': '字重',
                                    'letter-spacing': '字间距',
                                    'color': '颜色',
                                    'line-height': '行高',
                                    'text-align': '对齐方式',
                                    'text-shadow': '文字阴影',
                                    'background-color': '背景颜色',
                                    'border-radius': '圆角',
                                    'border': '边框',
                                    'box-shadow': '阴影',
                                    'opacity': '透明度'
                                }
                            }
                        }
                    }
                },

                // Plugins
                plugins: [gjsPresetWebpage, gjsBlocksBasic, gjsPluginForms],
                pluginsOpts: {
                    [gjsPresetWebpage as any]: {
                        modalImportTitle: '导入代码',
                        modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">请粘贴 HTML/CSS 代码并点击导入</div>',
                        modalImportContent: function (editor: any) {
                            return editor.getHtml() + '<style>' + editor.getCss() + '</style>'
                        },
                        blocksBasicOpts: { flexGrid: true },
                    },
                    [gjsBlocksBasic as any]: {
                        flexGrid: true,
                        category: '基础组件' // Override category name to match i18n
                    },
                    [gjsPluginForms as any]: {
                        category: '表单组件' // Override category name to match i18n
                    }
                },

                // Let the preset manage panels, but we can customize if needed
                // panels: { defaults: [] } // Removed to allow preset panels
            });

            // Store editor reference
            editorRef.current = editor;
            isInitializedRef.current = true;

            // Wait for editor to be fully loaded before setting components
            editor.on('load', () => {
                console.log('[GrapesEditor] Editor loaded (iframe ready)');

                // Show Blocks manager by default
                const openBlocksBtn = editor.Panels.getButton('views', 'open-blocks');
                if (openBlocksBtn) {
                    openBlocksBtn.set('active', true);
                }

                if (htmlContent) {
                    console.log('[GrapesEditor] Setting initial content');
                    try {
                        // Extract body content if full HTML document
                        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                        const contentToLoad = bodyMatch ? bodyMatch[1] : htmlContent;

                        editor.setComponents(contentToLoad);
                        lastHtmlRef.current = contentToLoad;

                        // Force refresh
                        editor.refresh();
                        console.log('[GrapesEditor] Content set successfully');
                    } catch (e) {
                        console.error('[GrapesEditor] Error setting content:', e);
                    }
                }
            });

            // Set up change listener with debounce
            let changeTimeout: NodeJS.Timeout;
            editor.on('component:update component:add component:remove style:update', () => {
                clearTimeout(changeTimeout);
                changeTimeout = setTimeout(() => {
                    const html = editor.getHtml();
                    const css = editor.getCss();

                    // Simple check to avoid loops
                    if (html !== lastHtmlRef.current) {
                        lastHtmlRef.current = html;
                        onHtmlChange?.(html, css || '');
                    }
                }, 500); // 增加 debounce 时间
            });

            // Notify parent that editor is ready
            onEditorReady?.(editor);

            console.log('[GrapesEditor] Editor instance created');

        } catch (error) {
            console.error('[GrapesEditor] Failed to initialize:', error);
        }

        // Cleanup on unmount
        return () => {
            console.log('[GrapesEditor] Cleanup called');
            if (editorRef.current) {
                try {
                    editorRef.current.destroy();
                } catch (e) {
                    console.warn('[GrapesEditor] Error destroying editor:', e);
                }
                editorRef.current = null;
                isInitializedRef.current = false;
            }
        };
    }, []); // Only run once on mount

    // Handle external htmlContent changes
    useEffect(() => {
        // Only update if editor is ready AND we have new content
        if (!editorRef.current || !htmlContent) return;

        // Use a timeout to ensure we don't conflict with initial load
        const timer = setTimeout(() => {
            try {
                // Extract body content if full HTML document
                const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                const contentToLoad = bodyMatch ? bodyMatch[1] : htmlContent;

                // Only update if content is actually different
                if (contentToLoad !== lastHtmlRef.current) {
                    console.log('[GrapesEditor] External HTML change detected, updating editor');
                    editorRef.current?.setComponents(contentToLoad);
                    lastHtmlRef.current = contentToLoad;
                }
            } catch (e) {
                console.error('[GrapesEditor] Error updating external content:', e);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [htmlContent]);

    // Handle preview device changes
    useEffect(() => {
        if (!editorRef.current) return;

        const deviceMap: Record<string, string> = {
            'desktop': 'Desktop',
            'tablet': 'Tablet',
            'mobile': 'Mobile'
        };

        const targetDevice = deviceMap[previewDevice] || 'Desktop';
        console.log('[GrapesEditor] Setting device to:', targetDevice);

        try {
            editorRef.current.setDevice(targetDevice);
        } catch (e) {
            console.error('[GrapesEditor] Error setting device:', e);
        }
    }, [previewDevice]);

    return (
        <div className="grapes-editor-wrapper w-full h-full relative">
            <div
                ref={containerRef}
                className="w-full h-full"
            />
        </div>
    );
};

export default GrapesEditor;
