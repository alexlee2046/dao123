import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { Asset } from '@/lib/actions/assets';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Page {
  path: string;
  content: string;
  // content_json 已废弃，GrapesJS 直接使用 content (HTML)
  status?: 'pending' | 'complete' | 'error';
}

interface StudioState {
  // Code content for the preview
  htmlContent: string; // Current page content
  pages: Page[]; // All pages
  currentPage: string; // Current page path

  setHtmlContent: (content: string) => void;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (path: string) => void;

  // Chat history
  messages: Message[];
  addMessage: (message: Message) => void;

  // User assets
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  setAssets: (assets: Asset[]) => void;
  removeAsset: (id: string) => void;

  // UI State
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;

  // History
  past: { pages: Page[], currentPage: string }[];
  future: { pages: Page[], currentPage: string }[];
  undo: () => void;
  redo: () => void;

  // Settings
  openRouterApiKey: string;
  selectedModel: string;
  setOpenRouterApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;

  // Project
  currentProject: {
    id: string;
    name: string;
    description?: string;
    is_public: boolean;
    preview_image?: string;
  } | null;
  setCurrentProject: (project: { id: string; name: string; description?: string; is_public: boolean; preview_image?: string } | null) => void;

  // Screenshot
  captureScreenshot: () => Promise<string | null>;
  setCaptureScreenshotHandler: (handler: () => Promise<string | null>) => void;

  // Builder Mode
  isBuilderMode: boolean;
  toggleBuilderMode: () => void;

  // Pending prompt for auto-generation after project creation
  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;

  // AI 生成内容缓存 (防止模式切换丢失)
  aiGeneratedCache: { html: string; timestamp: number } | null;
  setAiGeneratedCache: (html: string | null) => void;
  restoreFromCache: () => boolean; // 从缓存恢复，返回是否成功

  // 重置方法
  resetForNewProject: () => void;

  // 保存状态跟踪
  lastSavedAt: number | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error' | 'unsaved' | 'offline';
  markAsSaved: () => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error' | 'unsaved' | 'offline') => void;

  // GrapesJS Editor 引用
  editorRef: any | null;
  setEditorRef: (editor: any | null) => void;
  runCommand: (commandId: string, options?: any) => void;

  // Command Palette
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useStudioStore = create<StudioState>((set) => {
  const initialHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        </style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <!-- Hero Section -->
        <div class="relative overflow-hidden bg-white">
            <div class="max-w-7xl mx-auto">
                <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                    <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                        <div class="sm:text-center lg:text-left">
                            <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                                <span class="block xl:inline">Welcome to</span>
                                <span class="block text-indigo-600">Your New Website</span>
                            </h1>
                            <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                This is your starting point. Use the AI assistant to refine this content, or drag-and-drop elements to build your vision.
                            </p>
                            <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                <div class="rounded-md shadow">
                                    <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg">
                                        Get Started
                                    </a>
                                </div>
                                <div class="mt-3 sm:mt-0 sm:ml-3">
                                    <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg">
                                        Learn More
                                    </a>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50 flex items-center justify-center">
                 <svg class="h-56 w-56 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            </div>
        </div>
      </body>
    </html>
  `;

  // 初始状态（用于 reset）
  const getInitialState = () => ({
    htmlContent: initialHtml,
    pages: [{ path: 'index.html', content: initialHtml }] as Page[],
    currentPage: 'index.html',
    messages: [] as Message[],
    assets: [] as Asset[],
    past: [] as { pages: Page[], currentPage: string }[],
    future: [] as { pages: Page[], currentPage: string }[],
    currentProject: null as StudioState['currentProject'],
    isBuilderMode: true,
    pendingPrompt: null as string | null,
    aiGeneratedCache: null as StudioState['aiGeneratedCache'],
    lastSavedAt: null,
    saveStatus: 'idle' as 'idle' | 'saving' | 'saved' | 'error' | 'unsaved' | 'offline',
  });

  return {
    ...getInitialState(),
    previewDevice: 'desktop' as const,
    openRouterApiKey: typeof window !== 'undefined' ? localStorage.getItem('openRouterApiKey') || '' : '',
    selectedModel: typeof window !== 'undefined' ? localStorage.getItem('selectedModel') || '' : '',

    setHtmlContent: (content) => set((state) => {
      const normalize = (p: string) => p.replace(/^\//, '');
      const currentPath = normalize(state.currentPage);

      const newPages = state.pages.map(p =>
        normalize(p.path) === currentPath ? { ...p, content } : p
      );

      // If current page is not in pages (edge case), add it
      if (!newPages.find(p => normalize(p.path) === currentPath)) {
        newPages.push({ path: currentPath, content });
      }

      return {
        htmlContent: content,
        pages: newPages,
        past: [...state.past, { pages: state.pages, currentPage: state.currentPage }],
        future: []
      };
    }),

    setPages: (pages) => set((state) => {
      // Try to keep current page if it exists in new pages
      const normalize = (p: string) => p.replace(/^\//, '');
      const currentPath = normalize(state.currentPage);

      const currentStillExists = pages.find(p => normalize(p.path) === currentPath);
      const indexPage = pages.find(p => normalize(p.path) === 'index.html') || pages[0];

      const newCurrentPage = currentStillExists ? state.currentPage : (indexPage ? indexPage.path : 'index.html');
      const pageForContent = currentStillExists || indexPage;

      const newHtmlContent = pageForContent ? pageForContent.content : '';

      // 诊断日志
      console.log('[Store.setPages] Updating state:', {
        pagesCount: pages.length,
        currentPath,
        newCurrentPage,
        newHtmlContentLength: newHtmlContent?.length || 0,
        isDefaultContent: newHtmlContent?.includes('欢迎来到您的新网站') || newHtmlContent?.includes('Welcome')
      });

      return {
        pages,
        currentPage: newCurrentPage,
        htmlContent: newHtmlContent,
        past: [...state.past, { pages: state.pages, currentPage: state.currentPage }],
        future: []
      };
    }),

    setCurrentPage: (path) => set((state) => {
      const page = state.pages.find(p => p.path === path);
      if (!page) return state;
      return {
        currentPage: path,
        htmlContent: page.content,
      };
    }),

    // 初始化为空数组，欢迎消息由 ChatAssistant 组件使用 i18n 动态生成
    messages: [],
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

    assets: [],
    addAsset: (asset: Asset) => set((state) => ({ assets: [asset, ...state.assets] })),
    setAssets: (assets: Asset[]) => set({ assets }),
    removeAsset: (id: string) => set((state) => ({ assets: state.assets.filter(a => a.id !== id) })),

    setPreviewDevice: (device) => set({ previewDevice: device }),

    past: [],
    future: [],
    undo: () => set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        pages: previous.pages,
        currentPage: previous.currentPage,
        htmlContent: previous.pages.find(p => p.path === previous.currentPage)?.content || '',
        past: newPast,
        future: [{ pages: state.pages, currentPage: state.currentPage }, ...state.future]
      };
    }),
    redo: () => set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        pages: next.pages,
        currentPage: next.currentPage,
        htmlContent: next.pages.find(p => p.path === next.currentPage)?.content || '',
        past: [...state.past, { pages: state.pages, currentPage: state.currentPage }],
        future: newFuture
      };
    }),

    // Settings
    setOpenRouterApiKey: (key) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('openRouterApiKey', key);
      }
      set({ openRouterApiKey: key });
    },
    setSelectedModel: (model) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedModel', model);
      }
      set({ selectedModel: model });
    },

    // Project
    currentProject: null,
    setCurrentProject: (project) => set({ currentProject: project }),

    captureScreenshot: async () => null,
    setCaptureScreenshotHandler: (handler) => set({ captureScreenshot: handler }),

    // Builder Mode
    toggleBuilderMode: () => set((state) => ({ isBuilderMode: !state.isBuilderMode })),

    // Pending prompt for auto-generation
    pendingPrompt: null,
    setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),

    // AI 生成内容缓存
    aiGeneratedCache: null,
    setAiGeneratedCache: (html) => set({
      aiGeneratedCache: html ? { html, timestamp: Date.now() } : null
    }),
    restoreFromCache: () => {
      const state = useStudioStore.getState();
      if (state.aiGeneratedCache && state.aiGeneratedCache.html) {
        // 只恢复 5 分钟内的缓存
        const isRecent = Date.now() - state.aiGeneratedCache.timestamp < 5 * 60 * 1000;
        if (isRecent) {
          console.log('[Store] Restoring from AI cache, length:', state.aiGeneratedCache.html.length);
          // 直接更新 htmlContent 和当前 page
          set((s) => {
            const cachedHtml = s.aiGeneratedCache!.html;
            const newPages = s.pages.map(p =>
              p.path === s.currentPage ? { ...p, content: cachedHtml } : p
            );
            return {
              htmlContent: cachedHtml,
              pages: newPages,
            };
          });
          return true;
        }
      }
      return false;
    },

    resetForNewProject: () => set({
      ...getInitialState()
    }),

    lastSavedAt: null,
    saveStatus: 'idle',
    markAsSaved: () => set({ lastSavedAt: Date.now(), saveStatus: 'saved' }),
    setSaveStatus: (status) => set({ saveStatus: status }),

    // GrapesJS Editor 引用
    editorRef: null,
    setEditorRef: (editor) => set({ editorRef: editor }),
    runCommand: (commandId, options) => {
      const { editorRef } = useStudioStore.getState();
      if (editorRef && editorRef.Commands) {
        try {
          editorRef.Commands.run(commandId, options);
        } catch (e) {
          console.warn(`[Store] Command "${commandId}" failed:`, e);
        }
      }
    },

    // Command Palette
    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  };
});
