'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 80,
        damping: 26,
        restDelta: 0.001,
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-liquid-silver via-white to-liquid-silver origin-left z-[60]"
            style={{ scaleX }}
        />
    );
}
