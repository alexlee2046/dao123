export interface BuilderStyleProps {
    padding?: { top: string; right: string; bottom: string; left: string };
    margin?: { top: string; right: string; bottom: string; left: string };
    width?: string;
    height?: string;
    minHeight?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    color?: string;
    borderRadius?: string;
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    boxShadow?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
    
    // Layout
    gap?: string;
    columns?: number;

    // Responsive styles
    responsiveStyles?: {
        desktop?: Partial<BuilderStyleProps>;
        tablet?: Partial<BuilderStyleProps>;
        mobile?: Partial<BuilderStyleProps>;
    };

    // Animation
    animation?: {
        type: 'none' | 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight' | 'zoomIn' | 'bounce' | 'pulse';
        duration: number;
        delay: number;
        infinite?: boolean;
    };
}

export const getAnimationProps = (animation?: BuilderStyleProps['animation']) => {
    if (!animation || animation.type === 'none') return {};

    const { type, duration, delay, infinite } = animation;
    
    const transition = { 
        duration, 
        delay,
        repeat: infinite ? Infinity : 0,
        repeatType: infinite ? "reverse" : undefined
    };

    const variants = {
        fadeIn: {
            initial: { opacity: 0 },
            whileInView: { opacity: 1 }
        },
        fadeInUp: {
            initial: { opacity: 0, y: 50 },
            whileInView: { opacity: 1, y: 0 }
        },
        fadeInDown: {
            initial: { opacity: 0, y: -50 },
            whileInView: { opacity: 1, y: 0 }
        },
        fadeInLeft: {
            initial: { opacity: 0, x: -50 },
            whileInView: { opacity: 1, x: 0 }
        },
        fadeInRight: {
            initial: { opacity: 0, x: 50 },
            whileInView: { opacity: 1, x: 0 }
        },
        zoomIn: {
            initial: { opacity: 0, scale: 0.8 },
            whileInView: { opacity: 1, scale: 1 }
        },
        bounce: {
            initial: { y: 0 },
            whileInView: { y: -20 },
            transition: { ...transition, type: "spring", stiffness: 300 } // Override for bounce
        },
        pulse: {
            initial: { scale: 1 },
            whileInView: { scale: 1.05 },
            transition: { ...transition, repeat: Infinity, repeatType: "mirror" }
        }
    };

    const variant = variants[type] || {};
    
    // Merge transition if not already in variant (like bounce/pulse specific overrides)
    const finalTransition = (variant as any).transition || transition;

    return {
        initial: variant.initial,
        whileInView: variant.whileInView,
        viewport: { once: !infinite, amount: 0.2 }, // trigger when 20% visible
        transition: finalTransition
    };
};

export const getBuilderStyles = (props: BuilderStyleProps, device: 'desktop' | 'tablet' | 'mobile' = 'desktop') => {
    let activeProps = { ...props };

    // Merge responsive styles based on device priority (Mobile > Tablet > Desktop cascade or specific overrides)
    // Strategy: Start with base (desktop), then override if current device is tablet or mobile
    // Note: Typically "mobile-first" is CSS default, but here "base" is often desktop in editors.
    // Let's assume 'props' contains the desktop/base values.
    
    if (props.responsiveStyles) {
        if (device === 'tablet') {
            // Apply tablet overrides on top of base
            if (props.responsiveStyles.tablet) {
                activeProps = { ...activeProps, ...props.responsiveStyles.tablet };
            }
        } else if (device === 'mobile') {
            // Apply mobile overrides. 
            // Should we inherit tablet if mobile is missing? 
            // Usually cascading down: Desktop -> Tablet -> Mobile.
            // If I set padding on Tablet, Mobile should probably inherit it unless overridden?
            // For simplicity in this explicit editor model:
            // 1. Apply Tablet (if exists)
            // 2. Apply Mobile (if exists, overriding Tablet)
            // This ensures cascading behavior from larger to smaller screens if that's the mental model.
            // OR: treating them as isolated overrides. 
            // Let's stick to: Base -> Tablet -> Mobile cascade for now.
            
            if (props.responsiveStyles.tablet) {
                activeProps = { ...activeProps, ...props.responsiveStyles.tablet };
            }
            if (props.responsiveStyles.mobile) {
                activeProps = { ...activeProps, ...props.responsiveStyles.mobile };
            }
        }
        // If device is desktop, we just use base props (activeProps)
        // Optionally we could look at responsiveStyles.desktop but usually that's just 'props'.
    }

    const style: React.CSSProperties = {};

    // Spacing
    if (activeProps.padding) {
        style.paddingTop = activeProps.padding.top;
        style.paddingRight = activeProps.padding.right;
        style.paddingBottom = activeProps.padding.bottom;
        style.paddingLeft = activeProps.padding.left;
    }

    if (activeProps.margin) {
        style.marginTop = activeProps.margin.top;
        style.marginRight = activeProps.margin.right;
        style.marginBottom = activeProps.margin.bottom;
        style.marginLeft = activeProps.margin.left;
    }

    // Dimensions
    if (activeProps.width) style.width = activeProps.width;
    if (activeProps.height) style.height = activeProps.height;
    if (activeProps.minHeight) style.minHeight = activeProps.minHeight;

    // Background
    if (activeProps.backgroundColor) style.backgroundColor = activeProps.backgroundColor;
    if (activeProps.backgroundImage) {
        style.backgroundImage = `url(${activeProps.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
    }

    // Typography
    if (activeProps.color) style.color = activeProps.color;
    if (activeProps.textAlign) style.textAlign = activeProps.textAlign;
    if (activeProps.fontSize) style.fontSize = activeProps.fontSize;
    if (activeProps.fontWeight) style.fontWeight = activeProps.fontWeight;
    if (activeProps.lineHeight) style.lineHeight = activeProps.lineHeight;
    if (activeProps.textDecoration) style.textDecoration = activeProps.textDecoration;

    // Layout
    if (activeProps.gap) style.gap = activeProps.gap;
    if (activeProps.columns) {
        style.gridTemplateColumns = `repeat(${activeProps.columns}, minmax(0, 1fr))`;
    }

    // Border
    if (activeProps.borderRadius) style.borderRadius = activeProps.borderRadius;
    if (activeProps.borderWidth) style.borderWidth = activeProps.borderWidth;
    if (activeProps.borderStyle) style.borderStyle = activeProps.borderStyle;
    if (activeProps.borderColor) style.borderColor = activeProps.borderColor;

    // Shadow is usually a class in our control, but if it was a custom value we would add it here.
    // If boxShadow is a tailwind class, we should return it separately.
    
    return style;
};

export const getBuilderClassNames = (props: BuilderStyleProps, baseClass: string = '', device: 'desktop' | 'tablet' | 'mobile' = 'desktop') => {
    const classes = [baseClass];
    
    let activeProps = { ...props };
    
    if (props.responsiveStyles) {
        if (device === 'tablet') {
            if (props.responsiveStyles.tablet) activeProps = { ...activeProps, ...props.responsiveStyles.tablet };
        } else if (device === 'mobile') {
            if (props.responsiveStyles.tablet) activeProps = { ...activeProps, ...props.responsiveStyles.tablet };
            if (props.responsiveStyles.mobile) activeProps = { ...activeProps, ...props.responsiveStyles.mobile };
        }
    }

    if (activeProps.boxShadow && !activeProps.boxShadow.startsWith('none')) {
        classes.push(activeProps.boxShadow);
    }

    return classes.join(' ');
};
