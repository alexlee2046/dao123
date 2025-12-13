/**
 * 统一的键盘快捷键映射配置
 * 将快捷键映射到 GrapesJS 命令
 */

export const KEYBOARD_SHORTCUTS = {
    // 编辑操作
    'mod+s': 'dao:save',
    'mod+z': 'dao:undo',
    'mod+shift+z': 'dao:redo',

    // 组件操作
    'mod+c': 'core:copy',
    'mod+v': 'core:paste',
    'mod+x': 'core:cut',
    'delete': 'core:component-delete',
    'backspace': 'core:component-delete',
    'mod+d': 'dao:duplicate',

    // 视图操作
    'mod+k': 'dao:command-palette',
    'mod+p': 'dao:preview',
    'mod+e': 'dao:code-editor',
    'mod+\\': 'dao:toggle-sidebar',
    'mod+0': 'dao:zoom-reset',
    'mod+=': 'dao:zoom-in',
    'mod+-': 'dao:zoom-out',

    // 选择操作
    'escape': 'dao:deselect',
    'mod+a': 'core:select-all',
} as const;

export type ShortcutKey = keyof typeof KEYBOARD_SHORTCUTS;
export type CommandId = typeof KEYBOARD_SHORTCUTS[ShortcutKey];

/**
 * 获取快捷键显示文本（适配 Mac/Windows）
 */
export function getShortcutDisplay(shortcut: string): string {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

    return shortcut
        .replace('mod', isMac ? '⌘' : 'Ctrl')
        .replace('shift', isMac ? '⇧' : 'Shift')
        .replace('alt', isMac ? '⌥' : 'Alt')
        .replace('+', ' + ')
        .replace('delete', 'Del')
        .replace('backspace', '⌫');
}

/**
 * 命令定义接口
 */
export interface CommandDefinition {
    id: string;
    label: string;
    labelZh: string;
    shortcut?: string;
    category: 'edit' | 'view' | 'component' | 'file';
    icon?: string;
}

/**
 * 可用命令列表（用于 Command Palette）
 */
export const COMMAND_DEFINITIONS: CommandDefinition[] = [
    // 文件操作
    { id: 'dao:save', label: 'Save', labelZh: '保存', shortcut: 'mod+s', category: 'file', icon: 'Save' },
    { id: 'dao:preview', label: 'Preview', labelZh: '预览', shortcut: 'mod+p', category: 'file', icon: 'Eye' },
    { id: 'dao:code-editor', label: 'Code Editor', labelZh: '代码编辑器', shortcut: 'mod+e', category: 'file', icon: 'Code' },

    // 编辑操作
    { id: 'dao:undo', label: 'Undo', labelZh: '撤销', shortcut: 'mod+z', category: 'edit', icon: 'Undo' },
    { id: 'dao:redo', label: 'Redo', labelZh: '重做', shortcut: 'mod+shift+z', category: 'edit', icon: 'Redo' },
    { id: 'core:copy', label: 'Copy', labelZh: '复制', shortcut: 'mod+c', category: 'edit', icon: 'Copy' },
    { id: 'core:paste', label: 'Paste', labelZh: '粘贴', shortcut: 'mod+v', category: 'edit', icon: 'Clipboard' },
    { id: 'dao:duplicate', label: 'Duplicate', labelZh: '复制元素', shortcut: 'mod+d', category: 'edit', icon: 'CopyPlus' },

    // 组件操作
    { id: 'core:component-delete', label: 'Delete Component', labelZh: '删除组件', shortcut: 'delete', category: 'component', icon: 'Trash2' },
    { id: 'dao:deselect', label: 'Deselect', labelZh: '取消选择', shortcut: 'escape', category: 'component', icon: 'X' },
    { id: 'core:select-all', label: 'Select All', labelZh: '全选', shortcut: 'mod+a', category: 'component', icon: 'CheckSquare' },

    // 视图操作
    { id: 'dao:command-palette', label: 'Command Palette', labelZh: '命令面板', shortcut: 'mod+k', category: 'view', icon: 'Command' },
    { id: 'dao:toggle-sidebar', label: 'Toggle Sidebar', labelZh: '切换侧边栏', shortcut: 'mod+\\', category: 'view', icon: 'PanelLeft' },
    { id: 'dao:zoom-in', label: 'Zoom In', labelZh: '放大', shortcut: 'mod+=', category: 'view', icon: 'ZoomIn' },
    { id: 'dao:zoom-out', label: 'Zoom Out', labelZh: '缩小', shortcut: 'mod+-', category: 'view', icon: 'ZoomOut' },
    { id: 'dao:zoom-reset', label: 'Reset Zoom', labelZh: '重置缩放', shortcut: 'mod+0', category: 'view', icon: 'Maximize' },
];

/**
 * 解析快捷键字符串为 KeyboardEvent 匹配条件
 */
export function parseShortcut(shortcut: string): {
    key: string;
    mod: boolean;
    shift: boolean;
    alt: boolean;
} {
    const parts = shortcut.toLowerCase().split('+');
    return {
        key: parts[parts.length - 1],
        mod: parts.includes('mod'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
    };
}

/**
 * 检查 KeyboardEvent 是否匹配快捷键
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
    const { key, mod, shift, alt } = parseShortcut(shortcut);
    const isMod = event.metaKey || event.ctrlKey;

    // 处理特殊按键
    let eventKey = event.key.toLowerCase();
    if (eventKey === ' ') eventKey = 'space';

    return (
        eventKey === key &&
        isMod === mod &&
        event.shiftKey === shift &&
        event.altKey === alt
    );
}
