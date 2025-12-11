import React from 'react';
import { useTranslations } from 'next-intl';

export const LayersPanel = () => {
  const t = useTranslations('studio');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="p-3 border-b bg-white">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('layers')}
        </h3>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
        <p className="text-sm mb-2">Layers management is now integrated within the editor.</p>
        <p className="text-xs opacity-70">Please use the Layers panel inside the canvas.</p>
      </div>
    </div>
  );
};
