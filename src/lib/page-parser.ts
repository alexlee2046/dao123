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
    // 1. 尝试匹配 markdown 代码块
    const htmlMatch = content.match(/```html\s*([\s\S]*?)```/i);
    if (htmlMatch) {
        return htmlMatch[1];
    }

    // 2. 尝试匹配标准 HTML 文档结构 (<!DOCTYPE html> ... </html> 或 <html> ... </html>)
    const docMatch = content.match(/(<!DOCTYPE html[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
    if (docMatch) {
        return docMatch[1];
    }

    // 3. Fallback: 如果是一段纯 HTML (以 < 开头)
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
