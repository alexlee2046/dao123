import React, { useEffect, useRef, useCallback } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPluginForms from 'grapesjs-plugin-forms';
import gjsPluginExport from 'grapesjs-plugin-export';
import gjsCustomCode from 'grapesjs-custom-code';
import { useLocale, useMessages } from 'next-intl';
import { useStudioStore } from '@/lib/store';
import 'grapesjs/dist/css/grapes.min.css'; // Standard GrapesJS Structural CSS
import './grapes-custom-theme.css'; // Custom Forked Theme (matches Dao Assistant)

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
    /** Action callbacks for toolbar buttons */
    onSave?: () => void;
    onImportCode?: () => void;
    onPublishCommunity?: () => void;
    onShare?: () => void;
    onPublish?: () => void;
}

export const GrapesEditor: React.FC<GrapesEditorProps> = ({
    htmlContent,
    onHtmlChange,
    onEditorReady,
    readonly = false,
    previewDevice = 'desktop',
    onSave,
    onImportCode,
    onPublishCommunity,
    onShare,
    onPublish
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const isInitializedRef = useRef(false);
    const lastHtmlRef = useRef<string>('');
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Store references for global command access
    const setEditorRef = useStudioStore((s) => s.setEditorRef);
    const setCommandPaletteOpen = useStudioStore((s) => s.setCommandPaletteOpen);

    const locale = useLocale();
    const messages = useMessages();
    const editorMessages = (messages.studio as any)?.editor;

    // Initialize editor
    useEffect(() => {
        if (!containerRef.current) return;
        if (isInitializedRef.current) {
            console.log('[GrapesEditor] Already initialized, skipping');
            return;
        }

        // Helper to wait for DOM elements
        const waitForElement = (selector: string, timeout = 3000): Promise<Element | null> => {
            return new Promise((resolve) => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                const observer = new MutationObserver((mutations, obs) => {
                    const el = document.querySelector(selector);
                    if (el) {
                        obs.disconnect();
                        resolve(el);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Timeout to avoid infinite waiting
                setTimeout(() => {
                    observer.disconnect();
                    const finalEl = document.querySelector(selector);
                    if (!finalEl) console.warn(`[GrapesEditor] Timeout waiting for ${selector}`);
                    resolve(finalEl);
                }, timeout);
            });
        };

        const initEditor = async () => {
            console.log('[GrapesEditor] Initializing editor...', {
                htmlLength: htmlContent?.length,
                htmlPreview: htmlContent?.substring(0, 50) + '...'
            });

            // Wait for critical UI containers to be mounted
            await Promise.all([
                waitForElement('#gjs-style-manager'),
                waitForElement('#gjs-selector-manager'),
                waitForElement('#gjs-trait-manager'),
                waitForElement('#gjs-blocks-manager'),
                waitForElement('#gjs-layers-manager'),
            ]);

            try {
                const editor = grapesjs.init({
                    container: containerRef.current!,
                    // Force explicit height to ensure visibility
                    height: '100%',
                    width: '100%',
                    fromElement: false,

                    // ... (abbreviated for tool call simplicity, I will only target the changed block if possible, but the diff is large)
                    // Custom Asset Manager - use our React UI
                    assetManager: {
                        custom: true, // We handle asset selection via dao:open-assets event
                    },

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

                    // Component Decomposition Configuration
                    blockManager: {
                        appendTo: '#gjs-blocks-manager'
                    },
                    layerManager: {
                        appendTo: '#gjs-layers-manager'
                    },
                    styleManager: {
                        appendTo: '#gjs-style-manager',
                    },
                    traitManager: {
                        appendTo: '#gjs-trait-manager'
                    },
                    selectorManager: {
                        appendTo: '#gjs-selector-manager'
                    },

                    // Internationalization
                    i18n: {
                        locale: locale, // Use current next-intl locale
                        detectLocale: false,
                        localeFallback: 'en',
                        messages: {
                            [locale]: {
                                blockManager: {
                                    labels: editorMessages?.blockManager?.labels || {},
                                    categories: editorMessages?.blockManager?.categories || {}
                                },
                                styleManager: {
                                    sectors: editorMessages?.styleManager?.sectors || {},
                                    properties: editorMessages?.styleManager?.properties || {}
                                }
                            }
                        }
                    },

                    // Plugins
                    plugins: [gjsPresetWebpage, gjsPluginForms, gjsPluginExport, gjsCustomCode],
                    pluginsOpts: {
                        [gjsPresetWebpage as any]: {
                            modalImportTitle: editorMessages?.modals?.import?.title || 'Import Code',
                            modalImportLabel: `<div style="margin-bottom: 10px; font-size: 13px;">${editorMessages?.modals?.import?.label || 'Please paste HTML/CSS code and click Import'}</div>`,
                            modalImportContent: function (editor: any) {
                                return editor.getHtml() + '<style>' + editor.getCss() + '</style>'
                            },
                            // Configure the internal gjsBlocksBasic through blocksBasicOpts
                            blocksBasicOpts: {
                                flexGrid: true,
                                category: editorMessages?.blockManager?.categories?.Basic || 'Basic'
                            },
                        },
                        [gjsPluginForms as any]: {
                            category: editorMessages?.blockManager?.categories?.Forms || 'Forms'
                        },
                        [gjsPluginExport as any]: {
                            // Export plugin configuration
                            addExportBtn: false, // We use our own export UI via commands
                            btnLabel: editorMessages?.modals?.export?.title || 'Export',
                        },
                        [gjsCustomCode as any]: {
                            // Custom code block configuration
                            blockLabel: 'Custom Code',
                            blockCustomCode: {
                                label: 'Custom Code',
                                category: editorMessages?.blockManager?.categories?.Extra || 'Extra',
                            },
                            propsCustomCode: {
                                name: 'Custom Code'
                            },
                            modalTitle: editorMessages?.modals?.codeEdit?.title || 'Edit Code',
                            codeViewOptions: {
                                theme: 'hopscotch', // Dark theme for code editor
                                lineNumbers: true,
                            },
                            buttonLabel: editorMessages?.modals?.codeEdit?.button || 'Save',
                        }
                    },
                    panels: { defaults: [] }
                });

                // Store editor reference
                editorRef.current = editor;
                isInitializedRef.current = true;

                // Wait for editor to be fully loaded before setting components
                editor.on('load', () => {
                    console.log('[GrapesEditor] Editor loaded (iframe ready)');

                    // Trigger an immediate refresh and resizing to ensure panels connect
                    setTimeout(() => {
                        editor.refresh();
                        editor.trigger('change:device'); // Force device update
                    }, 100);

                    // Clean up default panels from presets (we use our own React UI)
                    // Use setTimeout to ensure we run AFTER the preset has fully initialized and rendered
                    setTimeout(() => {
                        const panelsToHide = [
                            'views-container',
                            'options',
                            'panel-top',
                            'basic-actions',
                            'panel-devices',
                            'panel-switcher',
                            'views', // Added 'views' just in case
                            'devices-c' // Sometimes used
                        ];

                        panelsToHide.forEach(id => {
                            try {
                                const panel = editor.Panels.getPanel(id);
                                if (panel) {
                                    editor.Panels.removePanel(id);
                                }
                            } catch (e) {
                                // Ignore if panel doesn't exist
                            }
                        });

                        // Force refresh to ensure layout updates
                        editor.refresh();
                        console.log('[GrapesEditor] Default panels cleaned up');
                    }, 0);

                    // No need to set active buttons for sidebar since we are using explicit containers below

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

                    // Custom action buttons removed - we now use the main React Toolbar
                    // const pn = editor.Panels;


                    // --- Custom Asset Manager Integration ---
                    // When GrapesJS needs to select an asset, dispatch event to open our React modal
                    editor.on('asset:custom', (props: any) => {
                        if (props.open) {
                            // Dispatch event to parent to open AssetPickerModal
                            const event = new CustomEvent('dao:open-asset-picker', {
                                detail: {
                                    types: props.types || ['image'],
                                    onSelect: (url: string) => {
                                        // GrapesJS select callback to apply the asset
                                        props.select({ src: url, type: 'image' });
                                    },
                                    onClose: () => {
                                        props.close();
                                    }
                                }
                            });
                            window.dispatchEvent(event);
                        }
                    });

                    // Register custom commands
                    editor.Commands.add('dao:save', {
                        run: () => { onSave?.(); }
                    });

                    // Undo/Redo commands (wrapping GrapesJS UndoManager)
                    editor.Commands.add('dao:undo', {
                        run: (ed) => { ed.UndoManager.undo(); }
                    });
                    editor.Commands.add('dao:redo', {
                        run: (ed) => { ed.UndoManager.redo(); }
                    });

                    // Duplicate component command
                    editor.Commands.add('dao:duplicate', {
                        run: (ed) => {
                            const selected = ed.getSelected();
                            if (selected) {
                                const parent = selected.parent();
                                if (parent) {
                                    const index = parent.components().indexOf(selected);
                                    const cloned = selected.clone();
                                    parent.components().add(cloned, { at: index + 1 });
                                    ed.select(cloned);
                                }
                            }
                        }
                    });

                    // Deselect command
                    editor.Commands.add('dao:deselect', {
                        run: (ed) => { ed.select(); }
                    });

                    // Preview command (dispatches event to open PreviewModal)
                    editor.Commands.add('dao:preview', {
                        run: () => {
                            window.dispatchEvent(new CustomEvent('dao:open-preview'));
                        }
                    });

                    // Code editor command
                    editor.Commands.add('dao:code-editor', {
                        run: () => {
                            window.dispatchEvent(new CustomEvent('dao:open-code-editor'));
                        }
                    });

                    // Command palette command
                    editor.Commands.add('dao:command-palette', {
                        run: () => {
                            setCommandPaletteOpen(true);
                        }
                    });

                    // Zoom commands
                    editor.Commands.add('dao:zoom-in', {
                        run: (editor) => {
                            const zoom = editor.Canvas.getZoom();
                            editor.Canvas.setZoom(zoom + 10); // +10%
                        }
                    });
                    editor.Commands.add('dao:zoom-out', {
                        run: (editor) => {
                            const zoom = editor.Canvas.getZoom();
                            editor.Canvas.setZoom(zoom - 10); // -10%
                        }
                    });
                    editor.Commands.add('dao:zoom-reset', {
                        run: (editor) => {
                            editor.Canvas.setZoom(100);
                        }
                    });

                    // Toggle sidebar command
                    editor.Commands.add('dao:toggle-sidebar', {
                        run: () => {
                            window.dispatchEvent(new CustomEvent('dao:toggle-sidebar'));
                        }
                    });

                    // --- Drag & Drop Integration ---
                    const canvas = editor.Canvas;
                    const frameEl = canvas.getFrameEl();

                    // We need to handle drop events on the iframe body
                    if (frameEl) {
                        const handleDragOver = (e: DragEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                        };

                        const handleDrop = (e: DragEvent) => {
                            e.preventDefault();
                            e.stopPropagation();

                            const imageUrl = e.dataTransfer?.getData('text/plain');
                            const assetJson = e.dataTransfer?.getData('application/json');

                            if (imageUrl) {
                                let assetType = 'image';
                                let assetName = 'Image';

                                // Try to parse JSON for more metadata
                                if (assetJson) {
                                    try {
                                        const asset = JSON.parse(assetJson);
                                        assetType = asset.type;
                                        assetName = asset.name;
                                    } catch (err) {
                                        // ignore
                                    }
                                }

                                // Get drop coordinates relative to the canvas
                                // Note: This is an approximation. For precise dropping inside containers, 
                                // GrapesJS has internal D&D logic but connecting external D&D is complex.
                                // We will simply append to the currently selected component or the wrapper.

                                const selected = editor.getSelected();
                                const target = selected || editor.getWrapper();

                                if (assetType === 'video') {
                                    editor.Components.addComponent({
                                        type: 'video',
                                        src: imageUrl,
                                        name: assetName,
                                        style: { width: '100%', height: 'auto' }
                                    }, { at: 0 }); // Prepend or append? Default append.
                                } else {
                                    // Default to image
                                    editor.Components.addComponent({
                                        type: 'image',
                                        src: imageUrl,
                                        alt: assetName,
                                        style: { width: '100%', height: 'auto' }
                                    }, { at: 0 });
                                }

                                console.log('[GrapesEditor] Dropped asset:', imageUrl);
                            }
                        };

                        frameEl.contentWindow?.addEventListener('dragover', handleDragOver);
                        frameEl.contentWindow?.addEventListener('drop', handleDrop);

                        // Cleanup on editor destroy is handled by iframe removal, 
                        // but good practice to remove listeners if we could.
                    }

                    // --- Legacy Event Listeners for backward compatibility ---
                    // These allow external components to still use CustomEvent pattern
                    const handleExternalUndo = () => editor.Commands.run('dao:undo');
                    const handleExternalRedo = () => editor.Commands.run('dao:redo');

                    // --- Code Editor Integration ---
                    const handleGetCode = (e: CustomEvent) => {
                        const { callback } = e.detail;
                        if (callback) {
                            const html = editor.getHtml();
                            const css = editor.getCss();
                            callback(html, css);
                        }
                    };

                    const handleSetCode = (e: CustomEvent) => {
                        const { html, css } = e.detail;
                        if (html !== undefined) {
                            editor.setComponents(html);
                        }
                        if (css !== undefined) {
                            editor.setStyle(css);
                        }
                    };

                    window.addEventListener('dao:undo', handleExternalUndo);
                    window.addEventListener('dao:redo', handleExternalRedo);
                    window.addEventListener('dao:get-code', handleGetCode as EventListener);
                    window.addEventListener('dao:set-code', handleSetCode as EventListener);

                    // Store editor reference globally for command access
                    setEditorRef(editor);

                    // Store cleanup function for unmount
                    (editor as any)._cleanupListeners = () => {
                        window.removeEventListener('dao:undo', handleExternalUndo);
                        window.removeEventListener('dao:redo', handleExternalRedo);
                        window.removeEventListener('dao:get-code', handleGetCode as EventListener);
                        window.removeEventListener('dao:set-code', handleSetCode as EventListener);
                        setEditorRef(null);
                    };
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

                // Handle resizing
                const observer = new ResizeObserver(() => {
                    if (editor) {
                        editor.refresh();
                    }
                });

                if (containerRef.current) {
                    observer.observe(containerRef.current);
                    resizeObserverRef.current = observer;
                }

            } catch (error) {
                console.error('[GrapesEditor] Failed to initialize:', error);
            }
        };

        // Run initialization
        initEditor();


        // Cleanup on unmount
        return () => {
            console.log('[GrapesEditor] Cleanup called');
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
            if (editorRef.current) {
                try {
                    if ((editorRef.current as any)._cleanupListeners) {
                        (editorRef.current as any)._cleanupListeners();
                    }
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
