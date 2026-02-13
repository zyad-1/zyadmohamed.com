import { cn } from '@/lib/utils/cn';
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
}

export const buttonBaseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] relative';

export const buttonVariants = {
    primary: 'bg-white text-black hover:bg-neutral-200 border border-transparent shadow-sm',
    secondary: 'bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.15)] border border-transparent backdrop-blur-sm',
    outline: 'bg-transparent border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-white',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-hover)]',
};

export const buttonSizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth = false, isLoading = false, children, ...props }, ref) => {

        return (
            <button
                ref={ref}
                className={cn(
                    buttonBaseStyles,
                    buttonVariants[variant],
                    buttonSizes[size],
                    fullWidth ? 'w-full' : '',
                    isLoading ? 'text-transparent pointer-events-none' : '',
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
