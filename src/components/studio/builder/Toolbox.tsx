import React from 'react';
import { useEditor, Element as CraftElement } from '@craftjs/core';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
    Type, Image, Square, Code, BoxSelect, Link2, Minus, Space,
    Video, LayoutGrid, Columns, Rows, CreditCard, Sparkles, Navigation, FolderDown
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Atoms
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { BuilderButton } from '@/components/builder/atoms/BuilderButton';
import { BuilderImage } from '@/components/builder/atoms/BuilderImage';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
import { BuilderLink } from '@/components/builder/atoms/BuilderLink';
import { BuilderDivider } from '@/components/builder/atoms/BuilderDivider';
import { BuilderSpacer } from '@/components/builder/atoms/BuilderSpacer';
import { BuilderVideo } from '@/components/builder/atoms/BuilderVideo';

// Layout
import { BuilderRow } from '@/components/builder/layout/BuilderRow';
import { BuilderColumn } from '@/components/builder/layout/BuilderColumn';
import { BuilderGrid } from '@/components/builder/layout/BuilderGrid';

// Blocks
import { BuilderCard } from '@/components/builder/blocks/BuilderCard';
import { BuilderHero } from '@/components/builder/blocks/BuilderHero';
import { BuilderNavbar } from '@/components/builder/blocks/BuilderNavbar';
import { BuilderFooter } from '@/components/builder/blocks/BuilderFooter';

// Special
import { CustomHTML } from '@/components/builder/special/CustomHTML';

export const Toolbox = () => {
    const t = useTranslations('builder');
    const { connectors } = useEditor();

    return (
        <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
                {/* 基础元素 */}
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        {t('basicElements')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderText text="New Text" />)}
                        >
                            <Type className="h-4 w-4" />
                            <span className="text-[10px]">{t('text')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderButton text="Button" />)}
                        >
                            <Square className="h-4 w-4" />
                            <span className="text-[10px]">{t('button')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderImage src="https://placehold.co/600x400" alt="Placeholder" />)}
                        >
                            <Image className="h-4 w-4" />
                            <span className="text-[10px]">{t('image')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderLink text="Link" href="#" />)}
                        >
                            <Link2 className="h-4 w-4" />
                            <span className="text-[10px]">{t('link')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderVideo src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />)}
                        >
                            <Video className="h-4 w-4" />
                            <span className="text-[10px]">{t('video')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderDivider />)}
                        >
                            <Minus className="h-4 w-4" />
                            <span className="text-[10px]">{t('divider')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground col-span-2"
                            ref={(ref: any) => connectors.create(ref, <BuilderSpacer height="48px" />)}
                        >
                            <Space className="h-4 w-4" />
                            <span className="text-[10px]">{t('spacer')}</span>
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* 布局组件 */}
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        {t('layoutComponents')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <CraftElement is={BuilderContainer} canvas />)}
                        >
                            <BoxSelect className="h-4 w-4" />
                            <span className="text-[10px]">{t('container')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <CraftElement is={BuilderRow} canvas />)}
                        >
                            <Columns className="h-4 w-4" />
                            <span className="text-[10px]">{t('row')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <CraftElement is={BuilderColumn} canvas />)}
                        >
                            <Rows className="h-4 w-4" />
                            <span className="text-[10px]">{t('column')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <CraftElement is={BuilderGrid} canvas />)}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            <span className="text-[10px]">{t('grid')}</span>
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* 区块组件 */}
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        {t('blockComponents')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderNavbar />)}
                        >
                            <Navigation className="h-4 w-4" />
                            <span className="text-[10px]">{t('navbar')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderHero />)}
                        >
                            <Sparkles className="h-4 w-4" />
                            <span className="text-[10px]">{t('hero')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderCard />)}
                        >
                            <CreditCard className="h-4 w-4" />
                            <span className="text-[10px]">{t('card')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground"
                            ref={(ref: any) => connectors.create(ref, <BuilderFooter />)}
                        >
                            <FolderDown className="h-4 w-4" />
                            <span className="text-[10px]">{t('footer')}</span>
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* 自定义代码 */}
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        {t('advanced')}
                    </h3>
                    <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center h-16 gap-1.5 text-muted-foreground hover:text-foreground w-full"
                        ref={(ref: any) => connectors.create(ref, <CustomHTML code="<div class='p-4 bg-yellow-100'>Custom HTML</div>" />)}
                    >
                        <Code className="h-4 w-4" />
                        <span className="text-[10px]">{t('customCode')}</span>
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );
};
