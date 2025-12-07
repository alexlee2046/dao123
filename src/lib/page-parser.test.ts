import { parseMultiPageResponse, cleanPageContent } from './page-parser';

describe('page-parser', () => {
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

    test('should handle markdown code blocks', () => {
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
        expect(result[0].content.trim()).toBe('<div id="1"></div>');
        expect(result[1].content.trim()).toBe('<div id="2"></div>');
    });
});
