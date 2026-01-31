import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
      variants: {
        variant: {
          default: 'bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--border-radius-button-default)] shadow-sm hover:shadow',
          destructive:
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[var(--border-radius-button-default)]',
          outline:
            'border border-black/10 dark:border-white/15 bg-background hover:bg-accent/50 hover:text-accent-foreground rounded-[var(--border-radius-button-default)]',
          secondary:
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-[var(--border-radius-button-default)]',
          'brand-secondary':
            'bg-brand-secondary hover:bg-brand-secondary/80 rounded-[var(--border-radius-button-default)]',
          ghost: 'hover:bg-accent hover:text-accent-foreground rounded-[var(--border-radius-button-rounded)]',
          link: 'text-primary underline-offset-4 hover:underline',
        },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-9 px-4 py-2',
        lg: 'h-11 px-6 py-3',
        icon: 'h-10 w-10 rounded-[var(--border-radius-button-default)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

