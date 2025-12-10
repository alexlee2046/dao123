/**
 * 通用验证工具函数
 * 用于验证用户输入的各种格式
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * 验证页面名称
 * 规则：只允许字母、数字、下划线、连字符和点，最大长度50
 */
export function validatePageName(name: string): ValidationResult {
    if (!name || name.trim() === '') {
        return { valid: false, error: 'pageNameRequired' };
    }

    // 检查非法字符（只允许字母、数字、下划线、连字符和点）
    const invalidCharsRegex = /[^a-zA-Z0-9_\-\.]/;
    if (invalidCharsRegex.test(name)) {
        return { valid: false, error: 'invalidPageName' };
    }

    // 检查长度
    if (name.length > 50) {
        return { valid: false, error: 'pageNameTooLong' };
    }

    return { valid: true };
}

/**
 * 验证电子邮件格式
 */
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim() === '') {
        return { valid: false, error: 'emailRequired' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'invalidEmail' };
    }

    return { valid: true };
}

/**
 * 验证密码强度
 * 规则：至少8个字符
 */
export function validatePassword(password: string): ValidationResult {
    if (!password) {
        return { valid: false, error: 'passwordRequired' };
    }

    if (password.length < 8) {
        return { valid: false, error: 'passwordTooShort' };
    }

    return { valid: true };
}

/**
 * 验证 URL 格式
 */
export function validateUrl(url: string): ValidationResult {
    if (!url || url.trim() === '') {
        return { valid: false, error: 'urlRequired' };
    }

    try {
        new URL(url);
        return { valid: true };
    } catch {
        return { valid: false, error: 'invalidUrl' };
    }
}

/**
 * 验证项目名称
 */
export function validateProjectName(name: string): ValidationResult {
    if (!name || name.trim() === '') {
        return { valid: false, error: 'projectNameRequired' };
    }

    if (name.length > 100) {
        return { valid: false, error: 'projectNameTooLong' };
    }

    return { valid: true };
}

/**
 * 通用非空验证
 */
export function validateRequired(value: unknown, fieldName: string): ValidationResult {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        return { valid: false, error: `${fieldName}Required` };
    }
    return { valid: true };
}
