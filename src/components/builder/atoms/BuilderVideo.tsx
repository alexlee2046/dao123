import React from 'react';
import { useNode } from '@craftjs/core';
import { BuilderStyleProps, getBuilderStyles, getBuilderClassNames } from '@/lib/builder/styleUtils';
import { useStudioStore } from '@/lib/store';

export interface BuilderVideoProps extends BuilderStyleProps {
    src: string;
    poster?: string;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    className?: string;
}

export const BuilderVideo = ({
    src,
    poster,
    controls = true,
    autoplay = false,
    loop = false,
    muted = false,
    className = '',
    ...props
}: BuilderVideoProps) => {
    const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
        selected: node.events.selected,
        hovered: node.events.hovered,
    }));

    const previewDevice = useStudioStore((state) => state.previewDevice);
    const styles = getBuilderStyles(props, previewDevice);
    const classes = getBuilderClassNames(props, className, previewDevice);

    // Check if it's a YouTube or Vimeo URL
    const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
    const isVimeo = src.includes('vimeo.com');

    const getEmbedUrl = () => {
        if (isYouTube) {
            const videoId = src.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
            return videoId ? `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}${muted ? '&mute=1' : ''}${loop ? '&loop=1' : ''}` : src;
        }
        if (isVimeo) {
            const videoId = src.match(/vimeo\.com\/(\d+)/)?.[1];
            return videoId ? `https://player.vimeo.com/video/${videoId}${autoplay ? '?autoplay=1' : ''}${muted ? '&muted=1' : ''}${loop ? '&loop=1' : ''}` : src;
        }
        return src;
    };

    return (
        <div
            ref={(ref: any) => connect(drag(ref))}
            style={styles}
            className={`${classes} ${selected ? 'outline outline-2 outline-blue-500 z-10 relative' : ''} ${hovered && !selected ? 'outline outline-1 outline-blue-300 z-10 relative' : ''}`}
        >
            {(isYouTube || isVimeo) ? (
                <iframe
                    src={getEmbedUrl()}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <video
                    src={src}
                    poster={poster}
                    controls={controls}
                    autoPlay={autoplay}
                    loop={loop}
                    muted={muted}
                    className="w-full"
                />
            )}
        </div>
    );
};

BuilderVideo.craft = {
    displayName: 'Video',
    props: {
        src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        poster: '',
        controls: true,
        autoplay: false,
        loop: false,
        muted: false,
        className: 'w-full rounded-lg overflow-hidden',
        padding: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    }
};
