import { BuilderStyleProps } from './styleUtils';

const SPACING_SCALE: Record<string, string> = {
    '0': '0px', 'px': '1px', '0.5': '2px', '1': '4px', '1.5': '6px',
    '2': '8px', '2.5': '10px', '3': '12px', '3.5': '14px', '4': '16px',
    '5': '20px', '6': '24px', '7': '28px', '8': '32px', '9': '36px',
    '10': '40px', '11': '44px', '12': '48px', '14': '56px', '16': '64px',
    '20': '80px', '24': '96px', '28': '112px', '32': '128px', '36': '144px',
    '40': '160px', '44': '176px', '48': '192px', '52': '208px', '56': '224px',
    '60': '240px', '64': '256px', '72': '288px', '80': '320px', '96': '384px',
    'auto': 'auto',
};

const SIZING_SCALE: Record<string, string> = {
    ...SPACING_SCALE,
    'full': '100%',
    'screen': '100vh',
    'min': 'min-content',
    'max': 'max-content',
    'fit': 'fit-content',
    '1/2': '50%', '1/3': '33.333333%', '2/3': '66.666667%',
    '1/4': '25%', '2/4': '50%', '3/4': '75%',
    '1/5': '20%', '2/5': '40%', '3/5': '60%', '4/5': '80%',
    '1/6': '16.666667%', '5/6': '83.333333%',
    '1/12': '8.333333%', '11/12': '91.666667%',
};

const FONT_SIZE_MAP: Record<string, string> = {
    'xs': '12px', 'sm': '14px', 'base': '16px', 'lg': '18px',
    'xl': '20px', '2xl': '24px', '3xl': '30px', '4xl': '36px',
    '5xl': '48px', '6xl': '60px', '7xl': '72px', '8xl': '96px', '9xl': '128px'
};

const FONT_WEIGHT_MAP: Record<string, string> = {
    'thin': '100', 'extralight': '200', 'light': '300', 'normal': '400',
    'medium': '500', 'semibold': '600', 'bold': '700', 'extrabold': '800', 'black': '900'
};

const ROUNDED_MAP: Record<string, string> = {
    'none': '0px', 'sm': '2px', 'DEFAULT': '4px', 'md': '6px',
    'lg': '8px', 'xl': '12px', '2xl': '16px', '3xl': '24px',
    'full': '9999px'
};

interface StyleAccumulator {
    padding: { top?: string; right?: string; bottom?: string; left?: string };
    margin: { top?: string; right?: string; bottom?: string; left?: string };
    width?: string;
    height?: string;
    minHeight?: string;
    backgroundColor?: string;
    color?: string;
    borderRadius?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: string;
    fontWeight?: string;
    textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
    backgroundImage?: string;
    boxShadow?: string;
    borderWidth?: string;
    borderColor?: string;
    borderStyle?: string;
    // Helper to track specificity
    _paddingSpecificity: { top: number; right: number; bottom: number; left: number };
    _marginSpecificity: { top: number; right: number; bottom: number; left: number };
}

const createAccumulator = (): StyleAccumulator => ({
    padding: {},
    margin: {},
    _paddingSpecificity: { top: 0, right: 0, bottom: 0, left: 0 },
    _marginSpecificity: { top: 0, right: 0, bottom: 0, left: 0 }
});

const parseSingleClass = (cls: string, acc: StyleAccumulator) => {
    // Spacing
    // p-*, px-*, py-*, pt-*, etc.
    const pMatch = cls.match(/^p([trblxy])?-([^-]+)$/);
    if (pMatch) {
        const [, dir, valKey] = pMatch;
        const val = SPACING_SCALE[valKey];
        if (val) {
            // Specificity: p=1, px/py=2, pt/pr...=3
            if (!dir) { // p-4
                if (acc._paddingSpecificity.top <= 1) { acc.padding.top = val; acc._paddingSpecificity.top = 1; }
                if (acc._paddingSpecificity.bottom <= 1) { acc.padding.bottom = val; acc._paddingSpecificity.bottom = 1; }
                if (acc._paddingSpecificity.left <= 1) { acc.padding.left = val; acc._paddingSpecificity.left = 1; }
                if (acc._paddingSpecificity.right <= 1) { acc.padding.right = val; acc._paddingSpecificity.right = 1; }
            } else if (dir === 'x') {
                if (acc._paddingSpecificity.left <= 2) { acc.padding.left = val; acc._paddingSpecificity.left = 2; }
                if (acc._paddingSpecificity.right <= 2) { acc.padding.right = val; acc._paddingSpecificity.right = 2; }
            } else if (dir === 'y') {
                if (acc._paddingSpecificity.top <= 2) { acc.padding.top = val; acc._paddingSpecificity.top = 2; }
                if (acc._paddingSpecificity.bottom <= 2) { acc.padding.bottom = val; acc._paddingSpecificity.bottom = 2; }
            } else if (dir === 't') { if (acc._paddingSpecificity.top <= 3) { acc.padding.top = val; acc._paddingSpecificity.top = 3; } }
            else if (dir === 'b') { if (acc._paddingSpecificity.bottom <= 3) { acc.padding.bottom = val; acc._paddingSpecificity.bottom = 3; } }
            else if (dir === 'l') { if (acc._paddingSpecificity.left <= 3) { acc.padding.left = val; acc._paddingSpecificity.left = 3; } }
            else if (dir === 'r') { if (acc._paddingSpecificity.right <= 3) { acc.padding.right = val; acc._paddingSpecificity.right = 3; } }
            return true;
        }
    }

    // Margin
    const mMatch = cls.match(/^-?m([trblxy])?-([^-]+)$/);
    if (mMatch) {
        const isNegative = cls.startsWith('-');
        const [, dir, valKey] = mMatch;
        let val = SPACING_SCALE[valKey];
        if (val) {
            if (isNegative && val !== '0px' && val !== 'auto') val = `-${val}`;
            
            if (!dir) { 
                if (acc._marginSpecificity.top <= 1) { acc.margin.top = val; acc._marginSpecificity.top = 1; }
                if (acc._marginSpecificity.bottom <= 1) { acc.margin.bottom = val; acc._marginSpecificity.bottom = 1; }
                if (acc._marginSpecificity.left <= 1) { acc.margin.left = val; acc._marginSpecificity.left = 1; }
                if (acc._marginSpecificity.right <= 1) { acc.margin.right = val; acc._marginSpecificity.right = 1; }
            } else if (dir === 'x') {
                if (acc._marginSpecificity.left <= 2) { acc.margin.left = val; acc._marginSpecificity.left = 2; }
                if (acc._marginSpecificity.right <= 2) { acc.margin.right = val; acc._marginSpecificity.right = 2; }
            } else if (dir === 'y') {
                if (acc._marginSpecificity.top <= 2) { acc.margin.top = val; acc._marginSpecificity.top = 2; }
                if (acc._marginSpecificity.bottom <= 2) { acc.margin.bottom = val; acc._marginSpecificity.bottom = 2; }
            } else if (dir === 't') { if (acc._marginSpecificity.top <= 3) { acc.margin.top = val; acc._marginSpecificity.top = 3; } }
            else if (dir === 'b') { if (acc._marginSpecificity.bottom <= 3) { acc.margin.bottom = val; acc._marginSpecificity.bottom = 3; } }
            else if (dir === 'l') { if (acc._marginSpecificity.left <= 3) { acc.margin.left = val; acc._marginSpecificity.left = 3; } }
            else if (dir === 'r') { if (acc._marginSpecificity.right <= 3) { acc.margin.right = val; acc._marginSpecificity.right = 3; } }
            return true;
        }
    }

    // Width
    if (cls.startsWith('w-')) {
        const val = SIZING_SCALE[cls.replace('w-', '')];
        if (val) { acc.width = val; return true; }
        // Handle arbitrary values like w-[300px]
        const arbitrary = cls.match(/^w-\[(.+)\]$/);
        if (arbitrary) { acc.width = arbitrary[1]; return true; }
    }

    // Height
    if (cls.startsWith('h-')) {
        const val = SIZING_SCALE[cls.replace('h-', '')];
        if (val) { acc.height = val; return true; }
        const arbitrary = cls.match(/^h-\[(.+)\]$/);
        if (arbitrary) { acc.height = arbitrary[1]; return true; }
    }

    // Min-Height
    if (cls.startsWith('min-h-')) {
        const val = SIZING_SCALE[cls.replace('min-h-', '')];
        if (val) { acc.minHeight = val; return true; }
        const arbitrary = cls.match(/^min-h-\[(.+)\]$/);
        if (arbitrary) { acc.minHeight = arbitrary[1]; return true; }
    }

    // Typography
    if (cls.startsWith('text-')) {
        const suffix = cls.replace('text-', '');
        if (['left', 'center', 'right', 'justify'].includes(suffix)) {
            acc.textAlign = suffix as any; return true;
        }
        if (FONT_SIZE_MAP[suffix]) {
            acc.fontSize = FONT_SIZE_MAP[suffix]; return true;
        }
        // Colors (simplified)
        if (suffix === 'white') { acc.color = '#ffffff'; return true; }
        if (suffix === 'black') { acc.color = '#000000'; return true; }
    }

    if (cls.startsWith('font-')) {
        const suffix = cls.replace('font-', '');
        if (FONT_WEIGHT_MAP[suffix]) {
            acc.fontWeight = FONT_WEIGHT_MAP[suffix]; return true;
        }
    }

    if (cls === 'underline') { acc.textDecoration = 'underline'; return true; }
    if (cls === 'line-through') { acc.textDecoration = 'line-through'; return true; }
    if (cls === 'no-underline') { acc.textDecoration = 'none'; return true; }

    // Background Image
    const bgImageMatch = cls.match(/^bg-\[url\(['"]?(.+?)['"]?\)?\]$/);
    if (bgImageMatch) {
        acc.backgroundImage = `url(${bgImageMatch[1]})`;
        return true;
    }

    // Background Color (Simplified)
    if (cls.startsWith('bg-')) {
        const suffix = cls.replace('bg-', '');
        if (suffix === 'white') { acc.backgroundColor = '#ffffff'; return true; }
        if (suffix === 'black') { acc.backgroundColor = '#000000'; return true; }
        if (suffix === 'transparent') { acc.backgroundColor = 'transparent'; return true; }
    }

    // Box Shadow
    if (cls.startsWith('shadow')) {
        const suffix = cls === 'shadow' ? 'DEFAULT' : cls.replace('shadow-', '');
        const shadowMap: Record<string, string> = {
            'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            'none': 'none'
        };
        if (shadowMap[suffix]) {
            acc.boxShadow = shadowMap[suffix];
            return true;
        }
    }

    // Border
    if (cls.startsWith('border')) {
        if (cls === 'border') {
            acc.borderWidth = '1px';
            return true;
        }
        
        const suffix = cls.replace('border-', '');
        
        // Width
        if (/^(\d+|px)$/.test(suffix)) {
             acc.borderWidth = suffix === 'px' ? '1px' : `${suffix}px`;
             return true;
        }
        
        // Style
        if (['solid', 'dashed', 'dotted', 'double', 'none'].includes(suffix)) {
            acc.borderStyle = suffix;
            return true;
        }
        
        // Color (Simplified)
        if (suffix === 'white') { acc.borderColor = '#ffffff'; return true; }
        if (suffix === 'black') { acc.borderColor = '#000000'; return true; }
        if (suffix === 'transparent') { acc.borderColor = 'transparent'; return true; }
    }

    // Border Radius
    if (cls.startsWith('rounded')) {
        const suffix = cls === 'rounded' ? 'DEFAULT' : cls.replace('rounded-', '');
        if (ROUNDED_MAP[suffix]) {
            acc.borderRadius = ROUNDED_MAP[suffix]; return true;
        }
    }

    return false;
};

const accumulatorToProps = (acc: StyleAccumulator): Partial<BuilderStyleProps> => {
    const props: Partial<BuilderStyleProps> = {};
    
    // Only add objects if they have keys
    if (Object.keys(acc.padding).length > 0) {
        props.padding = {
            top: acc.padding.top || '0px',
            right: acc.padding.right || '0px',
            bottom: acc.padding.bottom || '0px',
            left: acc.padding.left || '0px'
        };
    }
    if (Object.keys(acc.margin).length > 0) {
        props.margin = {
            top: acc.margin.top || '0px',
            right: acc.margin.right || '0px',
            bottom: acc.margin.bottom || '0px',
            left: acc.margin.left || '0px'
        };
    }
    
    if (acc.width) props.width = acc.width;
    if (acc.height) props.height = acc.height;
    if (acc.minHeight) props.minHeight = acc.minHeight;
    if (acc.backgroundColor) props.backgroundColor = acc.backgroundColor;
    if (acc.color) props.color = acc.color;
    if (acc.borderRadius) props.borderRadius = acc.borderRadius;
    if (acc.textAlign) props.textAlign = acc.textAlign;
    if (acc.fontSize) props.fontSize = acc.fontSize;
    if (acc.fontWeight) props.fontWeight = acc.fontWeight;
    if (acc.textDecoration) props.textDecoration = acc.textDecoration;
    if (acc.backgroundImage) props.backgroundImage = acc.backgroundImage;
    if (acc.boxShadow) props.boxShadow = acc.boxShadow;
    if (acc.borderWidth) props.borderWidth = acc.borderWidth;
    if (acc.borderColor) props.borderColor = acc.borderColor;
    if (acc.borderStyle) props.borderStyle = acc.borderStyle;

    return props;
};

export const parseTailwindClasses = (className: string): { props: BuilderStyleProps, remainingClasses: string } => {
    const baseAcc = createAccumulator();
    const mdAcc = createAccumulator();
    const lgAcc = createAccumulator();

    const classes = className.split(/\s+/).filter(Boolean);
    const remainingClasses: string[] = [];

    classes.forEach(cls => {
        if (cls.startsWith('lg:')) {
            const handled = parseSingleClass(cls.replace('lg:', ''), lgAcc);
            if (!handled) remainingClasses.push(cls);
        } else if (cls.startsWith('md:')) {
            const handled = parseSingleClass(cls.replace('md:', ''), mdAcc);
            if (!handled) remainingClasses.push(cls);
        } else if (cls.startsWith('sm:')) {
            // Treat sm as base/mobile for now
             const handled = parseSingleClass(cls.replace('sm:', ''), baseAcc);
             if (!handled) remainingClasses.push(cls);
        } else if (!cls.includes(':')) {
            const handled = parseSingleClass(cls, baseAcc);
            if (!handled) remainingClasses.push(cls);
        } else {
            // Other prefixes (hover:, etc) keep as class
            remainingClasses.push(cls);
        }
    });

    // Resolve Cascading
    // Mobile (Base)
    const mobileProps = accumulatorToProps(baseAcc);
    
    // Tablet (MD || Base)
    // We need to merge Base into MD accumulator to check values, OR just merge result props.
    // Merging props is safer.
    const tabletPropsRaw = accumulatorToProps(mdAcc);
    const tabletPropsResolved = { ...mobileProps, ...tabletPropsRaw };
    // Deep merge padding/margin
    if (mobileProps.padding || tabletPropsRaw.padding) {
        tabletPropsResolved.padding = { ...(mobileProps.padding || {}), ...(tabletPropsRaw.padding || {}) } as any;
    }
    if (mobileProps.margin || tabletPropsRaw.margin) {
        tabletPropsResolved.margin = { ...(mobileProps.margin || {}), ...(tabletPropsRaw.margin || {}) } as any;
    }

    // Desktop (LG || MD || Base)
    const desktopPropsRaw = accumulatorToProps(lgAcc);
    const desktopPropsResolved = { ...tabletPropsResolved, ...desktopPropsRaw };
    if (tabletPropsResolved.padding || desktopPropsRaw.padding) {
        desktopPropsResolved.padding = { ...(tabletPropsResolved.padding || {}), ...(desktopPropsRaw.padding || {}) } as any;
    }
    if (tabletPropsResolved.margin || desktopPropsRaw.margin) {
        desktopPropsResolved.margin = { ...(tabletPropsResolved.margin || {}), ...(desktopPropsRaw.margin || {}) } as any;
    }

    // Construct Final BuilderStyleProps
    // Props = Desktop
    const finalProps: BuilderStyleProps = { ...desktopPropsResolved };
    
    // Responsive Styles
    finalProps.responsiveStyles = {};

    // Tablet Overrides
    // If Tablet resolved is different from Desktop resolved, we need to store it?
    // No, in `styleUtils`, `props` is the base.
    // If we are on Tablet, we apply `responsiveStyles.tablet` ON TOP of `props`.
    // Wait, `styleUtils` says: "If device is desktop, we just use base props".
    // So `props` MUST be the Desktop values.
    
    // If I am on Tablet, `getBuilderStyles` takes `props` (Desktop) and merges `responsiveStyles.tablet`.
    // So `responsiveStyles.tablet` must contain the DIFFERENCE to turn Desktop into Tablet?
    // OR it contains the ABSOLUTE Tablet values?
    // `activeProps = { ...activeProps, ...props.responsiveStyles.tablet };`
    // It merges. So if Desktop has `padding: 20px` and Tablet wants `padding: 10px`,
    // `responsiveStyles.tablet` MUST have `padding: 10px`.
    
    // So yes, we just store the resolved Tablet values in `responsiveStyles.tablet`.
    // But strictly we only need to store it if it DIFFERS from Desktop?
    // If Desktop is p-8 and Tablet is p-8.
    // props = p-8.
    // If tablet is empty, it uses p-8. Correct.
    // If Desktop is p-8 and Tablet is p-4.
    // props = p-8.
    // tablet = p-4.
    // Merge: p-8 + p-4 = p-4. Correct.
    
    // So we can store `tabletPropsResolved` directly into `responsiveStyles.tablet`.
    // OPTIMIZATION: Only store if different from `desktopPropsResolved` (deep equality check) to keep JSON clean?
    // For simplicity, let's just store it if `mdAcc` had any values OR if `baseAcc` had values that `lgAcc` overrode?
    // Actually, checking deep equality is better.
    
    if (JSON.stringify(tabletPropsResolved) !== JSON.stringify(desktopPropsResolved)) {
        finalProps.responsiveStyles.tablet = tabletPropsResolved;
    }

    // Mobile Overrides
    // Applied on top of Tablet (if present) on top of Props?
    // `styleUtils`: 
    // if (device === 'mobile') {
    //    if (props.responsiveStyles.tablet) merge(tablet)
    //    if (props.responsiveStyles.mobile) merge(mobile)
    // }
    // So Mobile is merged ON TOP of Tablet (which is merged on top of Desktop).
    // So `responsiveStyles.mobile` must contain the Mobile values.
    
    if (JSON.stringify(mobileProps) !== JSON.stringify(tabletPropsResolved)) {
        finalProps.responsiveStyles.mobile = mobileProps;
    }

    return { props: finalProps, remainingClasses: remainingClasses.join(' ') };
};
