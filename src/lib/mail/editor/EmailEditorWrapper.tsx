'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import ReactDOM from 'react-dom';

// Polyfill findDOMNode for React 19 compatibility (required by easy-email dependencies)
if (typeof window !== 'undefined' && !(ReactDOM as any).findDOMNode) {
    (ReactDOM as any).findDOMNode = (component: any) => {
        return component instanceof HTMLElement ? component : (component?.current || null);
    };
}

const EmailEditor = dynamic(
    () => import('./EmailEditor'),
    { ssr: false }
);

class ErrorBoundary extends React.Component<any, { hasError: boolean; error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 space-y-4 max-w-2xl mx-auto mt-10 border rounded-lg bg-white shadow">
                    <div className="p-4 text-amber-700 bg-amber-50 border border-amber-200 rounded">
                        <h3 className="font-bold">⚠️ Visual Editor Incompatible</h3>
                        <p className="text-sm mt-1">
                            The generic drag-and-drop editor component (easy-email) requires an older version of React.
                            We are running on <strong>React 19 (Bleeding Edge)</strong>.
                        </p>
                        <p className="text-xs mt-2 text-gray-500">Error: {this.state.error?.toString()}</p>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Fallback HTML Editor</h4>
                        <p className="text-sm text-gray-500 mb-4">You can still test the Template System and Backend Integration.</p>
                        <textarea
                            className="w-full h-64 p-4 border rounded font-mono text-sm bg-gray-50"
                            defaultValue="<h1>Hello {{first_name}}</h1><p>This is a fallback template.</p>"
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => alert("Template Saved via Backend (Mock)")}
                                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                            >
                                Save Template (Test Backend)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function EmailEditorWrapper() {
    return (
        <ErrorBoundary>
            <EmailEditor />
        </ErrorBoundary>
    );
}
