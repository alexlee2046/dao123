import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const BuilderFrame = ({ children, title, className }: { children: React.ReactNode, title?: string, className?: string }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const initFrame = () => {
            const doc = iframe.contentDocument;
            if (!doc) return;

            // Reset document
            doc.open();
            doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
            doc.close();

            // Inject Tailwind
            const script = doc.createElement('script');
            script.src = 'https://cdn.tailwindcss.com';
            doc.head.appendChild(script);

            // Inject basic styles to ensure full height
            const style = doc.createElement('style');
            style.textContent = `
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
                body { overflow-y: auto; overflow-x: hidden; }
                * { box-sizing: border-box; }
            `;
            doc.head.appendChild(style);

            // Set mount node
            setMountNode(doc.body);
        };

        // Initial load
        if (iframe.contentDocument?.readyState === 'complete') {
            initFrame();
        } else {
            iframe.onload = initFrame;
        }

    }, []);

    // Re-inject head if specialized props change (not needed for basic use)

    return (
        <iframe
            ref={iframeRef}
            className={className || "w-full h-full border-0 bg-white"}
            title={title || "Builder Frame"}
            sandbox="allow-same-origin allow-scripts allow-forms"
        >
            {mountNode && createPortal(children, mountNode)}
        </iframe>
    );
};
