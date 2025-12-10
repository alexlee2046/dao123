import React, { useMemo } from 'react';
import { useNode, useEditor } from '@craftjs/core';
import DOMPurify from 'dompurify';

export interface CustomHTMLProps {
    code: string;
    className?: string;
}

/**
 * CustomHTML 组件 - 安全地渲染用户自定义 HTML
 * 使用 DOMPurify 对 HTML 进行消毒，防止 XSS 攻击
 */
export const CustomHTML = ({ code, className = '' }: CustomHTMLProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));

    // 使用 DOMPurify 消毒 HTML，防止 XSS 攻击
    const sanitizedHtml = useMemo(() => {
        if (typeof window === 'undefined') {
            // 服务端渲染时返回空字符串，避免 hydration 问题
            return '';
        }
        return DOMPurify.sanitize(code, {
            ADD_TAGS: ['style'], // 允许 style 标签用于样式
            ADD_ATTR: ['target', 'rel'], // 允许链接属性
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed'], // 明确禁止危险标签
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'], // 禁止事件处理器
        });
    }, [code]);

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            className={`${className} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            onClick={(e) => {
                if (enabled) {
                    // Prevent default behavior to avoid navigation or form submission in editor
                    // We only do this in editor mode
                    // Note: This relies on event bubbling. If an inner element stops propagation, this won't run.
                    e.preventDefault();
                }
            }}
        />
    );
};

CustomHTML.craft = {
    displayName: 'Custom HTML',
    props: {
        code: '<div class="p-4 bg-yellow-100 text-yellow-800 rounded">Custom HTML Block</div>',
        className: ''
    }
};
