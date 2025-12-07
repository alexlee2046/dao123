import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Asset {
  id: string;
  url: string;
  name: string;
  type: string;
  created_at?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Page {
  path: string;
  content: string;
  content_json?: string; // Builder JSON data
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
  builderData: string | null; // JSON string for Craft.js
  setBuilderData: (data: string | null) => void;
}

export const useStudioStore = create<StudioState>((set) => {
  const initialHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 flex items-center justify-center h-screen">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-800 mb-4">欢迎来到您的新网站</h1>
          <p class="text-gray-600">请告诉 AI 您想要修改什么！</p>
        </div>
      </body>
    </html>
  `;

  return {
    htmlContent: initialHtml,
    pages: [{ path: 'index.html', content: initialHtml }],
    currentPage: 'index.html',

    setHtmlContent: (content) => set((state) => {
      const newPages = state.pages.map(p =>
        p.path === state.currentPage ? { ...p, content } : p
      );
      // If current page is not in pages (edge case), add it
      if (!newPages.find(p => p.path === state.currentPage)) {
        newPages.push({ path: state.currentPage, content });
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
      const currentStillExists = pages.find(p => p.path === state.currentPage);
      const indexPage = pages.find(p => p.path === 'index.html') || pages[0];
      
      const newCurrentPage = currentStillExists ? state.currentPage : (indexPage ? indexPage.path : 'index.html');
      const pageForContent = currentStillExists || indexPage;
      
      const newHtmlContent = pageForContent ? pageForContent.content : '';
      const newBuilderData = pageForContent ? pageForContent.content_json || null : null;

      return {
        pages,
        currentPage: newCurrentPage,
        htmlContent: newHtmlContent,
        builderData: newBuilderData,
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
        builderData: page.content_json || null
      };
    }),

    messages: [
      {
        id: '1',
        role: 'assistant',
        content: "你好！我是你的设计助手。我可以帮你构建网站。你还没有上传任何素材。想要上传一个 Logo 开始吗？"
      }
    ],
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

    assets: [],
    addAsset: (asset: Asset) => set((state) => ({ assets: [asset, ...state.assets] })),
    setAssets: (assets: Asset[]) => set({ assets }),
    removeAsset: (id: string) => set((state) => ({ assets: state.assets.filter(a => a.id !== id) })),

    previewDevice: 'desktop',
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
    openRouterApiKey: typeof window !== 'undefined' ? localStorage.getItem('openRouterApiKey') || '' : '',
    selectedModel: 'anthropic/claude-3.5-sonnet',
    setOpenRouterApiKey: (key) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('openRouterApiKey', key);
      }
      set({ openRouterApiKey: key });
    },
    setSelectedModel: (model) => set({ selectedModel: model }),

    // Project
    currentProject: null,
    setCurrentProject: (project) => set({ currentProject: project }),

    captureScreenshot: async () => null,
    setCaptureScreenshotHandler: (handler) => set({ captureScreenshot: handler }),

    // Builder Mode
    isBuilderMode: false,
    toggleBuilderMode: () => set((state) => ({ isBuilderMode: !state.isBuilderMode })),
    builderData: null,
    setBuilderData: (data) => set((state) => {
        // Also update the current page's content_json
        const newPages = state.pages.map(p =>
            p.path === state.currentPage ? { ...p, content_json: data || undefined } : p
        );
        return {
            builderData: data,
            pages: newPages
        };
    }),
  };
});
