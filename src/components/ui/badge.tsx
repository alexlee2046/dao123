import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Clock, Pencil, X, AlertCircle, Pause, Play } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Status variants with semantic colors (accessible - not color-only)
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        info:
          "border-transparent bg-info text-info-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Status icon mapping for accessibility
const statusIcons = {
  active: Check,
  completed: Check,
  pending: Clock,
  draft: Pencil,
  error: X,
  warning: AlertCircle,
  paused: Pause,
  running: Play,
} as const

type StatusType = keyof typeof statusIcons

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * StatusBadge - Accessible status badge with icon
 * Uses icon + text for accessibility (not color-only)
 */
interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
}

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const Icon = statusIcons[status]

  // Map status to variant
  const variantMap: Record<StatusType, VariantProps<typeof badgeVariants>['variant']> = {
    active: 'success',
    completed: 'success',
    running: 'success',
    pending: 'warning',
    warning: 'warning',
    draft: 'secondary',
    paused: 'secondary',
    error: 'destructive',
  }

  const variant = variantMap[status]

  return (
    <Badge
      variant={variant}
      className={className}
      aria-label={`Status: ${label}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </Badge>
  )
}

export { Badge, StatusBadge, badgeVariants, type StatusType }
