'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils/cn';

interface TextTransitionProps {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
    delay?: number;
    inline?: boolean;
}

export default function TextTransition({
    children,
    className,
    as: Component = 'div',
    delay = 0,
    inline = false
}: TextTransitionProps) {
    const { language } = useLanguage();
    const isRTL = language === 'ar';

    const MotionComponent = inline ? motion.span : motion.div;

    return (
        <AnimatePresence mode="wait">
            <MotionComponent
                key={language} // Triggers animation on language change
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94], // --motion-ease
                    delay: delay
                }}
                className={cn(
                    "relative",
                    inline ? "inline-block" : "block",
                    className
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {Component !== 'div' ? (
                    <Component>{children}</Component>
                ) : (
                    children
                )}
            </MotionComponent>
        </AnimatePresence>
    );
}
