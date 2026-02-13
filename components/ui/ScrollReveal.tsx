'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export default function ScrollReveal({
    children,
    className,
    delay = 0,
    duration = 0.45,
    direction = 'up',
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (isInView && !hasAnimated) {
            setHasAnimated(true);
        }
    }, [isInView, hasAnimated]);

    const directionVariants = {
        up: { y: 24 },
        down: { y: -24 },
        left: { x: 24 },
        right: { x: -24 },
    };

    const initial = {
        opacity: 0,
        ...directionVariants[direction],
    };

    const animate = hasAnimated ? {
        opacity: 1,
        x: 0,
        y: 0,
    } : initial;

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={initial}
            animate={animate}
            transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay,
            }}
        >
            {children}
        </motion.div>
    );
}
