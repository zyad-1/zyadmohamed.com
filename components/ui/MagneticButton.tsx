'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

interface MagneticButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: 'outline' | 'filled';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
}

export default function MagneticButton({
    children,
    href,
    onClick,
    variant = 'outline',
    size = 'md',
    className,
    type = 'button',
    disabled = false,
}: MagneticButtonProps) {
    const ref = useRef<HTMLDivElement>(null);

    const sizeClasses = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-8 py-4 text-sm',
        lg: 'px-10 py-5 text-base',
    };

    const variantClasses = {
        outline: '',
        filled: 'magnetic-btn-filled',
    };

    const buttonContent = (
        <motion.div
            ref={ref}
            className={cn(
                'magnetic-btn group',
                sizeClasses[size],
                variantClasses[variant],
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            whileHover={disabled ? {} : { scale: 1.03 }}
            whileTap={disabled ? {} : { scale: 0.98 }}
        >
            <span className="relative z-10 flex items-center gap-2 group-hover:text-glow-white transition-all duration-300">
                {children}
            </span>

            {/* Liquid Hover Fill */}
            <motion.div
                className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            />
        </motion.div>
    );

    if (href && !disabled) {
        return (
            <Link href={href} className="inline-block relative">
                {buttonContent}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className="inline-block bg-transparent border-none p-0 relative"
        >
            {buttonContent}
        </button>
    );
}
