import React from 'react';
import Editor, { OnChange } from '@monaco-editor/react';
import { useTheme } from 'next-themes';

interface CodeEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    language?: string;
    height?: string;
    className?: string;
    minimap?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language = 'html',
    height = '200px',
    className,
    minimap = false
}) => {
    const { theme } = useTheme();

    const handleEditorChange: OnChange = (value) => {
        onChange(value);
    };

    return (
        <div className={`border rounded-md overflow-hidden ${className}`}>
            <Editor
                height={height}
                language={language}
                value={value}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: minimap },
                    scrollBeyondLastLine: false,
                    fontSize: 12,
                    lineNumbers: 'off',
                    folding: false,
                    wordWrap: 'on',
                    padding: { top: 8, bottom: 8 },
                    fontFamily: 'var(--font-mono)',
                    renderLineHighlight: 'none',
                    contextmenu: false,
                }}
            />
        </div>
    );
};
