import React from 'react';
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function DeviceSelector() {
    const previewDevice = useStudioStore(s => s.previewDevice);
    const setPreviewDevice = useStudioStore(s => s.setPreviewDevice);
    const runCommand = useStudioStore(s => s.runCommand);

    const devices = [
        { id: 'desktop', icon: Monitor, label: 'Desktop (100%)', command: 'dao:set-device-desktop' },
        { id: 'tablet', icon: Tablet, label: 'Tablet (768px)', command: 'dao:set-device-tablet' },
        { id: 'mobile', icon: Smartphone, label: 'Mobile (375px)', command: 'dao:set-device-mobile' },
    ] as const;

    const handleDeviceChange = (deviceId: typeof devices[number]['id'], command: string) => {
        setPreviewDevice(deviceId);
        runCommand(command);
    };

    return (
        <TooltipProvider delayDuration={300}>
            <div className={cn(
                "flex items-center p-1 bg-muted/40 rounded-full border border-border/20 shadow-sm backdrop-blur-md",
                "relative transition-all duration-300 hover:border-border/40 hover:bg-muted/60"
            )}>
                {devices.map((device) => {
                    const isActive = previewDevice === device.id;
                    const Icon = device.icon;
                    return (
                        <Tooltip key={device.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeviceChange(device.id, device.command)}
                                    className={cn(
                                        "relative h-8 w-8 rounded-full transition-all duration-300",
                                        isActive
                                            ? "text-primary shadow-sm ring-1 ring-border/10 bg-background"
                                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4 transition-transform duration-300", isActive && "scale-110")} />
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-full bg-primary/5 animate-pulse-once" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {device.label}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
