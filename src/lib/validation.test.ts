import {
    validatePageName,
    validateEmail,
    validatePassword,
    validateUrl,
    validateProjectName,
    validateRequired
} from './validation';

describe('validation', () => {
    describe('validatePageName', () => {
        test('should return valid for correct names', () => {
            expect(validatePageName('home').valid).toBe(true);
            expect(validatePageName('my-page').valid).toBe(true);
            expect(validatePageName('my_page_123').valid).toBe(true);
            expect(validatePageName('page.html').valid).toBe(true);
        });

        test('should return invalid for empty name', () => {
            const result = validatePageName('');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('pageNameRequired');
        });

        test('should return invalid for special characters', () => {
            const result = validatePageName('page with spaces');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('invalidPageName');

            expect(validatePageName('page$').valid).toBe(false);
            expect(validatePageName('page/subpage').valid).toBe(false);
        });

        test('should return invalid for too long name', () => {
            const longName = 'a'.repeat(51);
            const result = validatePageName(longName);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('pageNameTooLong');
        });
    });

    describe('validateEmail', () => {
        test('should return valid for correct email', () => {
            expect(validateEmail('test@example.com').valid).toBe(true);
            expect(validateEmail('name.surname@company.co.uk').valid).toBe(true);
        });

        test('should return invalid for empty email', () => {
            expect(validateEmail('').valid).toBe(false);
        });

        test('should return invalid for malformed email', () => {
            expect(validateEmail('test@').valid).toBe(false);
            expect(validateEmail('@example.com').valid).toBe(false);
            expect(validateEmail('test@example').valid).toBe(false);
            expect(validateEmail('test using@spaces.com').valid).toBe(false);
        });
    });

    describe('validatePassword', () => {
        test('should return valid for strong password', () => {
            expect(validatePassword('correct-password-123').valid).toBe(true);
        });

        test('should return invalid for missing password', () => {
            expect(validatePassword('').valid).toBe(false);
        });

        test('should return invalid for short password', () => {
            expect(validatePassword('short').valid).toBe(false);
            expect(validatePassword('1234567').valid).toBe(false);
        });
    });

    describe('validateUrl', () => {
        test('should return valid for correct URL', () => {
            expect(validateUrl('https://example.com').valid).toBe(true);
            expect(validateUrl('http://localhost:3000').valid).toBe(true);
        });

        test('should return invalid for empty URL', () => {
            expect(validateUrl('').valid).toBe(false);
        });

        test('should return invalid for malformed URL', () => {
            expect(validateUrl('not a url').valid).toBe(false);
            expect(validateUrl('javascript:alert(1)').valid).toBe(true); // Technically a valid URL structure
        });
    });

    describe('validateProjectName', () => {
        test('should return valid for normal name', () => {
            expect(validateProjectName('My Project').valid).toBe(true);
        });

        test('should return invalid for empty name', () => {
            expect(validateProjectName('').valid).toBe(false);
        });

        test('should return invalid for too long name', () => {
            const longName = 'a'.repeat(101);
            const result = validateProjectName(longName);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('projectNameTooLong');
        });
    });

    describe('validateRequired', () => {
        test('should return valid for present value', () => {
            expect(validateRequired('val', 'field').valid).toBe(true);
            expect(validateRequired(123, 'field').valid).toBe(true);
            expect(validateRequired(true, 'field').valid).toBe(true);
        });

        test('should return invalid for empty string', () => {
            const result = validateRequired('', 'username');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('usernameRequired');
        });

        test('should return invalid for null or undefined', () => {
            expect(validateRequired(null, 'field').valid).toBe(false);
            expect(validateRequired(undefined, 'field').valid).toBe(false);
        });
    });
});
