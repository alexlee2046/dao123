"use client";

import React, { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useStudioStore } from '@/lib/store';
import { COMMAND_DEFINITIONS, getShortcutDisplay, type CommandDefinition } from '@/lib/keyboard-shortcuts';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Save, Eye, Code, Undo, Redo, Copy, Clipboard, CopyPlus,
    Trash2, X, CheckSquare, Command, PanelLeft, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
    Save: <Save className="w-4 h-4 mr-2 text-muted-foreground" />,
    Eye: <Eye className="w-4 h-4 mr-2 text-muted-foreground" />,
    Code: <Code className="w-4 h-4 mr-2 text-muted-foreground" />,
    Undo: <Undo className="w-4 h-4 mr-2 text-muted-foreground" />,
    Redo: <Redo className="w-4 h-4 mr-2 text-muted-foreground" />,
    Copy: <Copy className="w-4 h-4 mr-2 text-muted-foreground" />,
    Clipboard: <Clipboard className="w-4 h-4 mr-2 text-muted-foreground" />,
    CopyPlus: <CopyPlus className="w-4 h-4 mr-2 text-muted-foreground" />,
    Trash2: <Trash2 className="w-4 h-4 mr-2 text-muted-foreground" />,
    X: <X className="w-4 h-4 mr-2 text-muted-foreground" />,
    CheckSquare: <CheckSquare className="w-4 h-4 mr-2 text-muted-foreground" />,
    Command: <Command className="w-4 h-4 mr-2 text-muted-foreground" />,
    PanelLeft: <PanelLeft className="w-4 h-4 mr-2 text-muted-foreground" />,
    ZoomIn: <ZoomIn className="w-4 h-4 mr-2 text-muted-foreground" />,
    ZoomOut: <ZoomOut className="w-4 h-4 mr-2 text-muted-foreground" />,
    Maximize: <Maximize className="w-4 h-4 mr-2 text-muted-foreground" />,
};

// Group commands by category
const groupedCommands = COMMAND_DEFINITIONS.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
        acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
}, {} as Record<string, CommandDefinition[]>);

const categoryLabels: Record<string, { en: string; zh: string }> = {
    file: { en: 'File', zh: '文件' },
    edit: { en: 'Edit', zh: '编辑' },
    component: { en: 'Component', zh: '组件' },
    view: { en: 'View', zh: '视图' },
};

export function CommandPalette() {
    const t = useTranslations('studio');
    const { isCommandPaletteOpen, setCommandPaletteOpen, runCommand } = useStudioStore();
    const [locale, setLocale] = useState<'zh' | 'en'>('zh');

    // Detect locale from next-intl
    useEffect(() => {
        const html = document.documentElement;
        const lang = html.lang || 'zh';
        setLocale(lang.startsWith('zh') ? 'zh' : 'en');
    }, []);

    // Handle keyboard shortcut to open
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K to open
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(!isCommandPaletteOpen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, setCommandPaletteOpen]);

    const handleSelect = useCallback((commandId: string) => {
        setCommandPaletteOpen(false);
        // Small delay to allow dialog to close before running command
        setTimeout(() => {
            runCommand(commandId);
        }, 100);
    }, [runCommand, setCommandPaletteOpen]);

    return (
        <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
            <CommandInput placeholder={locale === 'zh' ? "搜索命令..." : "Search commands..."} />
            <CommandList>
                <CommandEmpty>
                    {locale === 'zh' ? '未找到命令' : 'No commands found.'}
                </CommandEmpty>

                {Object.entries(groupedCommands).map(([category, commands], index) => (
                    <React.Fragment key={category}>
                        {index > 0 && <CommandSeparator />}
                        <CommandGroup heading={locale === 'zh' ? categoryLabels[category]?.zh : categoryLabels[category]?.en}>
                            {commands.map((cmd) => (
                                <CommandItem
                                    key={cmd.id}
                                    value={`${cmd.label} ${cmd.labelZh} ${cmd.id}`}
                                    onSelect={() => handleSelect(cmd.id)}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center">
                                        {cmd.icon && iconMap[cmd.icon]}
                                        <span>{locale === 'zh' ? cmd.labelZh : cmd.label}</span>
                                    </div>
                                    {cmd.shortcut && (
                                        <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                            {getShortcutDisplay(cmd.shortcut)}
                                        </kbd>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </React.Fragment>
                ))}
            </CommandList>
        </CommandDialog>
    );
}
