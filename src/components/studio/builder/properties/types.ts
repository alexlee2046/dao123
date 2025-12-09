
export interface SelectedComponentProps {
    id: string;
    name: string;
    displayName: string;
    isDeletable: boolean;

    // Content properties
    text?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonHref?: string;
    showSecondaryButton?: boolean;
    secondaryButtonText?: string;
    secondaryButtonHref?: string;
    src?: string;
    href?: string;
    target?: string;
    code?: string;
    alt?: string;

    // Style properties
    width?: string;
    height?: string;
    minHeight?: string;
    padding?: any;
    margin?: any;
    backgroundColor?: string;
    backgroundImage?: string;
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    textAlign?: string;
    textDecoration?: string;

    // Layout properties
    gap?: string;
    wrap?: boolean;
    columns?: number;
    justify?: string;
    align?: string;
    orientation?: string;

    // Border & Shadow properties
    borderWidth?: string;
    borderStyle?: string;
    borderColor?: string;
    borderRadius?: string;
    boxShadow?: string;

    // Element specific properties
    tag?: string;
    variant?: string;
    size?: string;
    objectFit?: string;
    poster?: string;
    controls?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    thickness?: string;

    // Animation & Advanced
    animation?: any;
    className?: string;

    // Responsive styles
    responsiveStyles?: {
        tablet?: Record<string, any>;
        mobile?: Record<string, any>;
        [key: string]: any;
    };

    // Index signature for other props
    [key: string]: any;
}
