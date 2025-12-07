import { type Page } from "./store";

/**
 * 清理页面内容，移除 markdown 代码块标记
 */
export const cleanPageContent = (html: string): string => {
    return html.replace(/```html\s*/gi, '').replace(/```\s*/g, '');
};

/**
 * 从 markdown 中提取 HTML 代码块
 */
export const extractHtml = (content: string): string | null => {
    const htmlMatch = content.match(/```html\s*([\s\S]*?)```/);
    if (htmlMatch) {
        return htmlMatch[1];
    }
    // 如果没有代码块但包含 HTML 标签，尝试返回原始内容
    if (content.trim().startsWith('<') && content.includes('>')) {
        return content;
    }
    return null;
};

/**
 * 从 AI 响应内容中解析多页面
 * 格式: <!-- page: filename.html --> content <!-- page: other.html --> content
 */
export const parseMultiPageResponse = (content: string): Page[] => {
    if (!content.includes('<!-- page:')) {
        return [];
    }

    const newPages: Page[] = [];
    const pageRegex = /<!-- page: (.*?) -->([\s\S]*?)(?=<!-- page: |$)/g;
    let match;

    while ((match = pageRegex.exec(content)) !== null) {
        const pathRaw = match[1].trim();
        // 确保路径以 .html 结尾
        const path = pathRaw.endsWith('.html') ? pathRaw : `${pathRaw}.html`;
        const pageHtml = cleanPageContent(match[2].trim());

        if (path && pageHtml) {
            newPages.push({
                path,
                content: pageHtml
            });
        }
    }

    return newPages;
};
