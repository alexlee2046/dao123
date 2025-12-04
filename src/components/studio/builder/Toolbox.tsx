import React from 'react';
import { useEditor } from '@craftjs/core';
import { Button } from '@/components/ui/button';
import { Type, Image, Square, Code, BoxSelect } from 'lucide-react';
import { BuilderText } from '@/components/builder/atoms/BuilderText';
import { BuilderButton } from '@/components/builder/atoms/BuilderButton';
import { BuilderImage } from '@/components/builder/atoms/BuilderImage';
import { BuilderContainer } from '@/components/builder/atoms/BuilderContainer';
import { CustomHTML } from '@/components/builder/special/CustomHTML';

export const Toolbox = () => {
    const { connectors } = useEditor();

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">组件库</h3>
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 gap-2"
                    ref={(ref: any) => connectors.create(ref, <BuilderText text="New Text" />)}
                >
                    <Type className="h-5 w-5" />
                    <span className="text-xs">文本</span>
                </Button>
                <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 gap-2"
                    ref={(ref: any) => connectors.create(ref, <BuilderButton text="Button" />)}
                >
                    <Square className="h-5 w-5" />
                    <span className="text-xs">按钮</span>
                </Button>
                <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 gap-2"
                    ref={(ref: any) => connectors.create(ref, <BuilderImage src="https://placehold.co/600x400" alt="Placeholder" />)}
                >
                    <Image className="h-5 w-5" />
                    <span className="text-xs">图片</span>
                </Button>
                <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 gap-2"
                    ref={(ref: any) => connectors.create(ref, <BuilderContainer />)}
                >
                    <BoxSelect className="h-5 w-5" />
                    <span className="text-xs">容器</span>
                </Button>
                <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-20 gap-2 col-span-2"
                    ref={(ref: any) => connectors.create(ref, <CustomHTML code="<div>Custom HTML</div>" />)}
                >
                    <Code className="h-5 w-5" />
                    <span className="text-xs">自定义代码</span>
                </Button>
            </div>
        </div>
    );
};
