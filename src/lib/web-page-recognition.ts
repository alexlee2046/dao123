import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface RecognitionResult {
    title: string;
    content: string;
    textContent: string;
    excerpt: string;
    byline: string;
    siteName: string;
    originalUrl?: string;
}

/**
 * Check if the string is a valid URL
 */
export const isValidUrl = (str: string): boolean => {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};

/**
 * Fetch and recognize content from a URL or raw HTML using Mozilla Readability
 */
export const recognizeWebPage = async (input: string): Promise<RecognitionResult | null> => {
    let html = input;
    let url = '';

    // If input is a URL, fetch it
    if (isValidUrl(input)) {
        try {
            url = input;
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            };
            const response = await fetch(input, { headers });
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }
            html = await response.text();
        } catch (error) {
            console.error('Error fetching URL:', error);
            throw error;
        }
    }

    try {
        // Use JSDOM to create a virtual DOM
        const doc = new JSDOM(html, {
            url: url || 'http://localhost',
        });

        // Use Readability to parse the document
        const reader = new Readability(doc.window.document);
        const article = reader.parse();

        if (!article) {
            return null;
        }

        return {
            title: article.title || '',
            content: article.content || '',
            textContent: article.textContent || '',
            excerpt: article.excerpt || '',
            byline: article.byline || '',
            siteName: article.siteName || '',
            originalUrl: url,
        };
    } catch (error) {
        console.error('Error recognizing web page:', error);
        throw error;
    }
};
