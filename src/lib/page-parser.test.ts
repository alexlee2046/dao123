import { parseMultiPageResponse, cleanPageContent, extractHtml } from './page-parser';

describe('page-parser', () => {
    describe('cleanPageContent', () => {
        test('should remove markdown code block markers', () => {
            const input = '```html\n<div>content</div>\n```';
            expect(cleanPageContent(input).trim()).toBe('<div>content</div>');
        });

        test('should remove generic code block markers', () => {
            const input = '```\n<div>content</div>\n```';
            expect(cleanPageContent(input).trim()).toBe('<div>content</div>');
        });

        test('should handle content without markers', () => {
            const input = '<div>content</div>';
            expect(cleanPageContent(input)).toBe('<div>content</div>');
        });

        test('should handle markers with uppercase HTML', () => {
            const input = '```HTML\n<div>content</div>\n```';
            expect(cleanPageContent(input).trim()).toBe('<div>content</div>');
        });
    });

    describe('extractHtml', () => {
        test('should extract content from markdown code block', () => {
            const content = 'Here is code:\n```html\n<!DOCTYPE html><html></html>\n```';
            expect(extractHtml(content)?.trim()).toBe('<!DOCTYPE html><html></html>');
        });

        test('should extract regular HTML document structure', () => {
            const content = 'Text before\n<!DOCTYPE html><html><body>Test</body></html>\nText after';
            expect(extractHtml(content)).toBe('<!DOCTYPE html><html><body>Test</body></html>');
        });

        test('should extract simple html tag structure', () => {
            const content = 'Text before\n<html><body>Test</body></html>\nText after';
            expect(extractHtml(content)).toBe('<html><body>Test</body></html>');
        });

        test('should fallback to raw content if it looks like HTML', () => {
            const content = '<div>Just a div</div>';
            // Now scaffolds partial content
            expect(extractHtml(content)).toContain('<!DOCTYPE html>');
            expect(extractHtml(content)).toContain('<div>Just a div</div>');
        });

        test('should scaffold body content', () => {
            const content = '<body>Content</body>';
            const result = extractHtml(content);
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('src="https://cdn.tailwindcss.com"');
            expect(result).toContain('<body>Content</body>');
        });

        test('should return null for non-html content', () => {
            const content = 'Just plain text';
            expect(extractHtml(content)).toBeNull();
        });

        test('should prioritize markdown block over plain HTML detection', () => {
            const content = '```html\n<div>Inside Block</div>\n```\n<div>Outside</div>';
            const result = extractHtml(content);
            expect(result?.trim()).toBe('<div>Inside Block</div>');
        });
    });

    describe('parseMultiPageResponse', () => {
        test('should return empty array if no page markers found', () => {
            const content = 'Just some text\nWith no page markers';
            const result = parseMultiPageResponse(content);
            expect(result).toEqual([]);
        });

        test('should parse single page correctly', () => {
            const content = `
Sure, here is the page:
<!-- page: index.html -->
<!DOCTYPE html>
<html><body><h1>Hello</h1></body></html>
            `;
            const result = parseMultiPageResponse(content);
            expect(result).toHaveLength(1);
            expect(result[0].path).toBe('index.html');
            expect(result[0].content).toContain('<h1>Hello</h1>');
        });

        test('should parse multiple pages correctly', () => {
            const content = `
I created three pages for you:

<!-- page: index.html -->
<html><body>Home</body></html>

<!-- page: about -->
<html><body>About</body></html>

<!-- page: contact.html -->
<html><body>Contact</body></html>
            `;
            const result = parseMultiPageResponse(content);
            expect(result).toHaveLength(3);

            expect(result[0].path).toBe('index.html');
            expect(result[0].content).toBe('<html><body>Home</body></html>');

            // Should auto-append .html
            expect(result[1].path).toBe('about.html');
            expect(result[1].content).toBe('<html><body>About</body></html>');

            expect(result[2].path).toBe('contact.html');
            expect(result[2].content).toBe('<html><body>Contact</body></html>');
        });

        test('should handle markdown code blocks inside pages', () => {
            const content = `
<!-- page: index.html -->
\`\`\`html
<!DOCTYPE html>
<body>Code Block</body>
\`\`\`
            `;
            const result = parseMultiPageResponse(content);
            expect(result).toHaveLength(1);
            expect(result[0].content.trim()).toBe('<!DOCTYPE html>\n<body>Code Block</body>');
        });

        test('should handle content between pages', () => {
            const content = `
<!-- page: page1.html -->
<div id="1"></div>

Some explanation text here...

<!-- page: page2.html -->
<div id="2"></div>
            `;
            const result = parseMultiPageResponse(content);
            expect(result).toHaveLength(2);
            // Parser captures everything until the next marker
            expect(result[0].content.trim()).toContain('<div id="1"></div>');
            expect(result[0].content.trim()).toContain('Some explanation text here...');
            expect(result[1].content.trim()).toBe('<div id="2"></div>');
        });
    });
});
