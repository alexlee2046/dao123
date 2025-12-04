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
    pageTitle: z.string(),
    seoDescription: z.string(),
    sections: z.array(SectionPlanSchema),
});

export type SitePlan = z.infer<typeof SitePlanSchema>;

// 3. Component Schema (Builder Agent)
// Recursive schema for component tree
const BaseComponentSchema = z.object({
    type: z.enum(['BuilderContainer', 'BuilderText', 'BuilderButton', 'BuilderImage', 'CustomHTML']),
    props: z.record(z.any()).describe("Props for the component (className, text, src, etc.)"),
});

export type ComponentNode = z.infer<typeof BaseComponentSchema> & {
    children?: ComponentNode[];
};

export const ComponentSchema: z.ZodType<ComponentNode> = BaseComponentSchema.extend({
    children: z.lazy(() => z.array(ComponentSchema).optional()),
});
