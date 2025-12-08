'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Volume2, VolumeX } from 'lucide-react';
import type { H5Project } from '@/lib/actions/h5';

interface H5ViewerProps {
    project: H5Project;
}

export function H5Viewer({ project }: H5ViewerProps) {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const pages = project.content?.pages || [];
    const config = project.h5_config || {};
    const currentPage = pages[currentPageIndex] || { elements: [], background: '#ffffff' };

    // 处理滑动
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let startY = 0;
        let startX = 0;

        const handleTouchStart = (e: TouchEvent) => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const endY = e.changedTouches[0].clientY;
            const endX = e.changedTouches[0].clientX;
            const diffY = startY - endY;
            const diffX = startX - endX;

            // 如果垂直滑动大于水平滑动
            if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
                if (diffY > 0 && currentPageIndex < pages.length - 1) {
                    // 向上滑动 - 下一页
                    setCurrentPageIndex(prev => prev + 1);
                } else if (diffY < 0 && currentPageIndex > 0) {
                    // 向下滑动 - 上一页
                    setCurrentPageIndex(prev => prev - 1);
                }
            }
        };

        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [currentPageIndex, pages.length]);

    // 处理背景音乐
    useEffect(() => {
        if (config.music_url && audioRef.current) {
            if (!isMuted) {
                audioRef.current.play().catch(() => { });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isMuted, config.music_url]);

    // 页面切换动画
    const getPageVariants = () => {
        switch (config.page_effect) {
            case 'fade':
                return {
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0 }
                };
            case 'flip':
                return {
                    initial: { rotateX: 90, opacity: 0 },
                    animate: { rotateX: 0, opacity: 1 },
                    exit: { rotateX: -90, opacity: 0 }
                };
            case 'slide':
            default:
                return {
                    initial: { y: '100%', opacity: 0 },
                    animate: { y: 0, opacity: 1 },
                    exit: { y: '-100%', opacity: 0 }
                };
        }
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 overflow-hidden touch-pan-y"
            style={{ background: currentPage.background || '#ffffff' }}
        >
            {/* 背景音乐 */}
            {config.music_url && (
                <audio ref={audioRef} src={config.music_url} loop />
            )}

            {/* 音乐控制按钮 */}
            {config.music_url && (
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white"
                >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
            )}

            {/* 页面内容 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPageIndex}
                    variants={getPageVariants()}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                    style={{ background: currentPage.background || 'transparent' }}
                >
                    {currentPage.elements?.map((element: any, index: number) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 + 0.2 }}
                            className="h5-viewer-element"
                            dangerouslySetInnerHTML={{
                                __html: `<div style="${element.style || ''}">${element.content}</div>`
                            }}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* 页面指示器 */}
            {config.show_page_indicator !== false && pages.length > 1 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                    {pages.map((_: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setCurrentPageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${index === currentPageIndex
                                ? 'bg-white scale-125 shadow-lg'
                                : 'bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* 滑动提示 */}
            {currentPageIndex < pages.length - 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/70"
                >
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <ChevronUp className="h-6 w-6" />
                    </motion.div>
                    <span className="text-xs mt-1">向上滑动</span>
                </motion.div>
            )}

            {/* 底部品牌 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-black/30 dark:text-white/30">
                由 dao123 生成
            </div>
        </div>
    );
}
