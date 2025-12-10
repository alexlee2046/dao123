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
