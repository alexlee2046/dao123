import React from 'react';

export const BlockManagerPanel = () => {
    return (
        <div className="h-full flex flex-col bg-background">
            <div id="gjs-blocks-manager" className="flex-1 overflow-y-auto custom-scrollbar" />
        </div>
    );
};

export const LayerManagerPanel = () => {
    return (
        <div className="h-full flex flex-col bg-background">
            <div id="gjs-layers-manager" className="flex-1 overflow-y-auto custom-scrollbar" />
        </div>
    );
};
