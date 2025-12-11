import { NextResponse } from 'next/server';

/**
 * 统一 API 错误处理工具
 * 提供一致的错误响应格式和日志记录
 */

// 错误类型定义
export interface ApiError {
    code: string;
    message: string;
    details?: unknown;
    status: number;
}

// 预定义的错误类型
export const ErrorCodes = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    BAD_REQUEST: 'BAD_REQUEST',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
    INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
    CONFIG_ERROR: 'CONFIG_ERROR',
} as const;

// 错误消息映射
const errorMessages: Record<string, { message: string; status: number }> = {
    [ErrorCodes.UNAUTHORIZED]: { message: '未授权访问', status: 401 },
    [ErrorCodes.FORBIDDEN]: { message: '禁止访问', status: 403 },
    [ErrorCodes.NOT_FOUND]: { message: '资源未找到', status: 404 },
    [ErrorCodes.BAD_REQUEST]: { message: '请求参数错误', status: 400 },
    [ErrorCodes.VALIDATION_ERROR]: { message: '验证失败', status: 400 },
    [ErrorCodes.INTERNAL_ERROR]: { message: '服务器内部错误', status: 500 },
    [ErrorCodes.RATE_LIMITED]: { message: '请求过于频繁，请稍后重试', status: 429 },
    [ErrorCodes.INSUFFICIENT_CREDITS]: { message: '积分不足', status: 402 },
    [ErrorCodes.CONFIG_ERROR]: { message: '服务配置错误', status: 500 },
};

/**
 * 创建 API 错误响应
 */
export function createErrorResponse(
    code: keyof typeof ErrorCodes | string,
    customMessage?: string,
    details?: unknown
): NextResponse {
    const errorInfo = errorMessages[code] || { message: '未知错误', status: 500 };

    const response = {
        error: {
            code,
            message: customMessage || errorInfo.message,
            ...(details && process.env.NODE_ENV === 'development' ? { details } : {}),
        },
    };

    return NextResponse.json(response, { status: errorInfo.status });
}

/**
 * 处理 API 异常并返回标准化响应
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
    // 记录错误日志
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[API Error]${context ? ` ${context}:` : ''}`, {
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
    });

    // 检查是否是已知的业务错误
    if (error instanceof ApiBusinessError) {
        return createErrorResponse(error.code, error.message, error.details);
    }

    // 未知错误返回通用错误
    return createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        process.env.NODE_ENV === 'development' ? errorMessage : undefined
    );
}

/**
 * 自定义业务错误类
 */
export class ApiBusinessError extends Error {
    code: string;
    details?: unknown;

    constructor(code: keyof typeof ErrorCodes | string, message?: string, details?: unknown) {
        const errorInfo = errorMessages[code];
        super(message || errorInfo?.message || '未知错误');
        this.code = code;
        this.details = details;
        this.name = 'ApiBusinessError';
    }
}

/**
 * 包装异步处理函数，自动捕获错误
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
    handler: T,
    context?: string
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await handler(...args);
        } catch (error) {
            return handleApiError(error, context);
        }
    }) as T;
}

/**
 * 断言函数 - 用于验证条件，失败时抛出业务错误
 */
export function assertCondition(
    condition: boolean,
    code: keyof typeof ErrorCodes,
    message?: string
): asserts condition {
    if (!condition) {
        throw new ApiBusinessError(code, message);
    }
}

/**
 * 解析 OpenRouter 特定错误并返回用户友好的中文消息
 * @returns 用户友好消息，如果不是 OpenRouter 特定错误则返回 null
 */
export function parseOpenRouterError(error: unknown): string | null {
    const message = error instanceof Error ? error.message : String(error);

    // Data policy / Free model publication error
    if (message.includes('data policy') || message.includes('Free model publication')) {
        return '当前模型需要数据共享许可。请在 OpenRouter 设置中开启数据共享，或联系管理员。';
    }

    // No endpoints found
    if (message.includes('No endpoints found')) {
        return '找不到可用的模型端点。请检查模型配置或稍后重试。';
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('Rate limit')) {
        return 'API 调用频率过高，请稍后重试。';
    }

    // Model not found / unavailable
    if (message.includes('model') && (message.includes('not found') || message.includes('unavailable'))) {
        return '所选模型不可用。请尝试选择其他模型。';
    }

    // API key issues
    if (message.includes('API key') || message.includes('Unauthorized') || message.includes('401')) {
        return 'API 密钥无效或未配置。请联系管理员检查配置。';
    }

    // Credit/balance issues from provider
    if (message.includes('insufficient') && message.includes('balance')) {
        return 'API 服务商余额不足。请联系管理员充值。';
    }

    return null; // Not an OpenRouter-specific error we recognize
}
