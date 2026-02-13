'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface LiquidGlassCardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'strong';
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function LiquidGlassCard({
    children,
    className,
    variant = 'default',
    hover = true,
    padding = 'md',
}: LiquidGlassCardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6 md:p-8',
        lg: 'p-8 md:p-12',
    };

    const variantClasses = {
        default: 'glass-card',
        strong: 'glass-card-strong',
    };

    return (
        <motion.div
            className={cn(
                variantClasses[variant],
                paddingClasses[padding],
                className
            )}
            whileHover={hover ? {
                scale: 1.01,
                transition: { duration: 0.3 }
            } : {}}
        >
            {children}
        </motion.div>
    );
}
