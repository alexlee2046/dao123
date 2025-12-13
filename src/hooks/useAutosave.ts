"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudioStore } from '@/lib/store';
import { updateProject, updateProjectMetadata } from '@/lib/actions/projects';
import { useTranslations } from 'next-intl';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved' | 'offline';

interface UseAutosaveOptions {
    /** Delay in milliseconds before autosave triggers (default: 3000) */
    delay?: number;
    /** Whether autosave is enabled (default: true) */
    enabled?: boolean;
    /** Callback when save succeeds */
    onSaveSuccess?: () => void;
    /** Callback when save fails */
    onSaveError?: (error: Error) => void;
}

interface UseAutosaveReturn {
    /** Current save status */
    status: AutosaveStatus;
    /** Last saved timestamp */
    lastSavedAt: number | null;
    /** Manually trigger save */
    save: () => Promise<void>;
    /** Whether there are unsaved changes */
    hasUnsavedChanges: boolean;
    /** Error message if any */
    error: string | null;
}

export function useAutosave(options: UseAutosaveOptions = {}): UseAutosaveReturn {
    const {
        delay = 3000,
        enabled = true,
        onSaveSuccess,
        onSaveError,
    } = options;

    const t = useTranslations('studio');
    const {
        currentProject,
        htmlContent,
        pages,
        captureScreenshot,
        markAsSaved,
        lastSavedAt,
        saveStatus,
        setSaveStatus
    } = useStudioStore();

    const [error, setError] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Keep track of last saved content for comparison
    const lastSavedContentRef = useRef<string>('');
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(false);

    // Check for online status
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Initial check
        if (typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
        }

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Update status based on online status
    useEffect(() => {
        if (!isOnline) {
            setSaveStatus('offline');
        } else if (saveStatus === 'offline') {
            setSaveStatus('idle');
        }
    }, [isOnline, saveStatus, setSaveStatus]);

    // Core save function
    const save = useCallback(async () => {
        if (!currentProject?.id || isSavingRef.current || !isOnline) {
            return;
        }

        try {
            isSavingRef.current = true;
            setSaveStatus('saving');
            setError(null);

            // Get screenshot for preview
            let screenshot: string | null = null;
            try {
                screenshot = await captureScreenshot();
            } catch (err) {
                console.warn('Failed to capture screenshot:', err);
            }

            // Save project data
            await updateProject(currentProject.id, {
                html: htmlContent,
                pages,
                content_json: undefined,
            });

            // Update preview image if screenshot was captured
            if (screenshot) {
                await updateProjectMetadata(currentProject.id, {
                    preview_image: screenshot
                });
            }

            // Update state
            setHasUnsavedChanges(false);
            lastSavedContentRef.current = htmlContent;
            markAsSaved(); // This sets saveStatus to 'saved' and updates timestamp

            onSaveSuccess?.();

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            setSaveStatus('error');
            onSaveError?.(err instanceof Error ? err : new Error(errorMessage));
        } finally {
            isSavingRef.current = false;
        }
    }, [currentProject, htmlContent, pages, captureScreenshot, markAsSaved, isOnline, onSaveSuccess, onSaveError, setSaveStatus]);

    // Detect content changes and trigger autosave
    useEffect(() => {
        if (!enabled || !currentProject?.id) {
            return;
        }

        // Check if content has changed (and it's not the initial load)
        const hasContent = htmlContent && htmlContent.trim().length > 0;

        if (hasContent && htmlContent !== lastSavedContentRef.current) {
            setHasUnsavedChanges(true);

            // Allow manual save status update even before autosave triggers
            if (saveStatus === 'saved' || saveStatus === 'idle') {
                setSaveStatus('unsaved');
            }

            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // Set new timeout for autosave
            saveTimeoutRef.current = setTimeout(() => {
                save();
            }, delay);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [htmlContent, enabled, currentProject?.id, delay, save, saveStatus, setSaveStatus]);

    // Initialize last saved content
    useEffect(() => {
        if (currentProject?.id && !lastSavedContentRef.current && htmlContent) {
            lastSavedContentRef.current = htmlContent;
        }
    }, [currentProject?.id, htmlContent]);

    return {
        status: saveStatus,
        lastSavedAt,
        save,
        hasUnsavedChanges,
        error,
    };
}
