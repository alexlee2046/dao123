import { z } from 'zod';

// 1. Design System Schema (Designer Agent)
export const DesignSystemSchema = z.object({
    themeName: z.string().describe("Name of the design theme (e.g., 'Modern Minimal', 'Cyberpunk')"),
    colors: z.object({
        primary: z.string().describe("Primary color hex code or Tailwind class"),
        secondary: z.string().describe("Secondary color hex code or Tailwind class"),
        background: z.string().describe("Background color hex code or Tailwind class"),
        text: z.string().describe("Text color hex code or Tailwind class"),
        accent: z.string().describe("Accent color hex code or Tailwind class"),
    }),
    typography: z.object({
        fontFamily: z.string().describe("Font family string"),
        headingSize: z.string().describe("Tailwind class for headings (e.g., 'text-4xl')"),
        bodySize: z.string().describe("Tailwind class for body text (e.g., 'text-base')"),
    }),
    spacing: z.object({
        sectionPadding: z.string().describe("Tailwind class for section padding (e.g., 'py-12')"),
        elementGap: z.string().describe("Tailwind class for element gap (e.g., 'gap-4')"),
    }),
    borderRadius: z.string().describe("Tailwind class for border radius (e.g., 'rounded-lg')"),
});

export type DesignSystem = z.infer<typeof DesignSystemSchema>;

// 2. Site Plan Schema (Architect Agent)
export const SectionPlanSchema = z.object({
    id: z.string().describe("Unique ID for the section"),
    type: z.enum(['Hero', 'Features', 'Testimonials', 'Pricing', 'FAQ', 'Footer', 'Header', 'CallToAction', 'Custom']).describe("Type of the section"),
    description: z.string().describe("Detailed description of what this section should contain and look like"),
    contentRequirements: z.array(z.string()).describe("List of specific content items to include"),
});

export const SitePlanSchema = z.object({
    siteName: z.string().describe("Name of the website"),
    pages: z.array(z.object({
        path: z.string().describe("File path, e.g., 'index.html', 'about.html'"),
        title: z.string(),
        seoDescription: z.string(),
        sections: z.array(SectionPlanSchema)
    })).describe("List of pages to generate. Must include index.html")
});

export type SitePlan = z.infer<typeof SitePlanSchema>;

// 3. Component Schema (Builder Agent)

// Common Style Props (subset of BuilderStyleProps)
const BuilderStyleSchema = z.object({
    className: z.string().optional().describe("Tailwind classes"),
    padding: z.object({
        top: z.string(),
        right: z.string(),
        bottom: z.string(),
        left: z.string()
    }).optional(),
    margin: z.object({
        top: z.string(),
        right: z.string(),
        bottom: z.string(),
        left: z.string()
    }).optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    minHeight: z.string().optional(),
    backgroundColor: z.string().optional(),
    backgroundImage: z.string().optional(),
    color: z.string().optional(),
    borderRadius: z.string().optional(),
    borderWidth: z.string().optional(),
    borderStyle: z.string().optional(),
    borderColor: z.string().optional(),
    boxShadow: z.string().optional(),
    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    lineHeight: z.string().optional(),
    textDecoration: z.enum(['none', 'underline', 'line-through', 'overline']).optional(),
    
    // Animation
    animation: z.object({
        type: z.enum(['none', 'fadeIn', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'zoomIn', 'bounce', 'pulse']),
        duration: z.number(),
        delay: z.number(),
        infinite: z.boolean().optional()
    }).optional(),
});

// Atom Schemas
const BuilderTextSchema = z.object({
    type: z.literal('BuilderText'),
    props: BuilderStyleSchema.extend({
        text: z.string(),
        tag: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span']).optional().default('p'),
    }),
    children: z.undefined().optional()
});

const BuilderButtonSchema = z.object({
    type: z.literal('BuilderButton'),
    props: BuilderStyleSchema.extend({
        text: z.string(),
        href: z.string().optional(),
        variant: z.enum(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']).optional().default('default'),
        size: z.enum(['default', 'sm', 'lg', 'icon']).optional().default('default'),
    }),
    children: z.undefined().optional()
});

const BuilderImageSchema = z.object({
    type: z.literal('BuilderImage'),
    props: BuilderStyleSchema.extend({
        src: z.string(),
        alt: z.string(),
        objectFit: z.enum(['contain', 'cover', 'fill', 'none', 'scale-down']).optional().default('cover'),
    }),
    children: z.undefined().optional()
});

const BuilderLinkSchema = z.object({
    type: z.literal('BuilderLink'),
    props: BuilderStyleSchema.extend({
        text: z.string(),
        href: z.string(),
        target: z.enum(['_self', '_blank']).optional().default('_self'),
        textDecoration: z.enum(['none', 'underline', 'line-through', 'overline']).optional().default('none'),
    }),
    children: z.undefined().optional()
});

const BuilderVideoSchema = z.object({
    type: z.literal('BuilderVideo'),
    props: BuilderStyleSchema.extend({
        src: z.string(),
        poster: z.string().optional(),
        controls: z.boolean().optional().default(true),
        autoplay: z.boolean().optional().default(false),
        loop: z.boolean().optional().default(false),
        muted: z.boolean().optional().default(false),
    }),
    children: z.undefined().optional()
});

const BuilderDividerSchema = z.object({
    type: z.literal('BuilderDivider'),
    props: BuilderStyleSchema.extend({
        orientation: z.enum(['horizontal', 'vertical']).optional().default('horizontal'),
        thickness: z.string().optional().default('1px'),
        color: z.string().optional().default('#e5e7eb'),
    }),
    children: z.undefined().optional()
});

const CustomHTMLSchema = z.object({
    type: z.literal('CustomHTML'),
    props: BuilderStyleSchema.extend({
        code: z.string(),
    }),
    children: z.undefined().optional()
});

// Recursive definition helper
const ComponentSchemaProxy: z.ZodType<any> = z.lazy(() => ComponentSchema);
const NodeArraySchema = z.array(ComponentSchemaProxy).optional();

// Layout Schemas
const BuilderContainerSchema = z.object({
    type: z.literal('BuilderContainer'),
    props: BuilderStyleSchema,
    children: NodeArraySchema
});

const BuilderRowSchema = z.object({
    type: z.literal('BuilderRow'),
    props: BuilderStyleSchema.extend({
        gap: z.string().optional().default('16px'),
        justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).optional().default('start'),
        align: z.enum(['start', 'center', 'end', 'stretch', 'baseline']).optional().default('center'),
        wrap: z.boolean().optional().default(true),
    }),
    children: NodeArraySchema
});

const BuilderColumnSchema = z.object({
    type: z.literal('BuilderColumn'),
    props: BuilderStyleSchema.extend({
        gap: z.string().optional().default('16px'),
        justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).optional().default('start'),
        align: z.enum(['start', 'center', 'end', 'stretch']).optional().default('stretch'),
    }),
    children: NodeArraySchema
});

const BuilderGridSchema = z.object({
    type: z.literal('BuilderGrid'),
    props: BuilderStyleSchema.extend({
        columns: z.number().optional().default(3),
        gap: z.string().optional().default('16px'),
    }),
    children: NodeArraySchema
});

// Block Schemas
const BuilderHeroSchema = z.object({
    type: z.literal('BuilderHero'),
    props: BuilderStyleSchema.extend({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        description: z.string().optional(),
        buttonText: z.string().optional(),
        buttonHref: z.string().optional(),
        secondaryButtonText: z.string().optional(),
        secondaryButtonHref: z.string().optional(),
        showSecondaryButton: z.boolean().optional().default(true),
    }),
    children: z.undefined().optional()
});

const BuilderCardSchema = z.object({
    type: z.literal('BuilderCard'),
    props: BuilderStyleSchema.extend({
        imageSrc: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        buttonText: z.string().optional(),
        buttonHref: z.string().optional(),
        showImage: z.boolean().optional().default(true),
        showButton: z.boolean().optional().default(true),
        variant: z.enum(['default', 'bordered', 'elevated']).optional().default('default'),
    }),
    children: z.undefined().optional()
});

const BuilderNavbarSchema = z.object({
    type: z.literal('BuilderNavbar'),
    props: BuilderStyleSchema.extend({
        logo: z.string().optional(),
        logoText: z.string().optional(),
        items: z.array(z.object({
            label: z.string(),
            href: z.string()
        })).optional(),
        ctaText: z.string().optional(),
        ctaHref: z.string().optional(),
        showCta: z.boolean().optional().default(true),
        variant: z.enum(['light', 'dark', 'transparent']).optional().default('light'),
        sticky: z.boolean().optional().default(true),
    }),
    children: z.undefined().optional()
});

const BuilderFooterSchema = z.object({
    type: z.literal('BuilderFooter'),
    props: BuilderStyleSchema.extend({
        logoText: z.string().optional(),
        description: z.string().optional(),
        footerColumns: z.array(z.object({
            title: z.string(),
            links: z.array(z.object({
                label: z.string(),
                href: z.string()
            }))
        })).optional(),
        copyright: z.string().optional(),
        showSocialLinks: z.boolean().optional().default(true),
        variant: z.enum(['light', 'dark']).optional().default('dark'),
    }),
    children: z.undefined().optional()
});

export const ComponentSchema = z.discriminatedUnion('type', [
    BuilderTextSchema,
    BuilderButtonSchema,
    BuilderImageSchema,
    BuilderLinkSchema,
    BuilderVideoSchema,
    BuilderDividerSchema,
    CustomHTMLSchema,
    BuilderContainerSchema,
    BuilderRowSchema,
    BuilderColumnSchema,
    BuilderGridSchema,
    BuilderHeroSchema,
    BuilderCardSchema,
    BuilderNavbarSchema,
    BuilderFooterSchema
]);

export type ComponentNode = z.infer<typeof ComponentSchema>;
