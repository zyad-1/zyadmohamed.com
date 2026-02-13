'use client';

import { motion } from 'framer-motion';

export default function NebulaBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[var(--color-obsidian)] pointer-events-none">
            {/* Deep Space Base Gradient */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, transparent 100%)'
                }}
            />

            {/* Aurora / Nebula Layer 1 (Violet/Indigo) */}
            <motion.div
                className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full blur-[100px] opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(75, 0, 130, 0.4) 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, 50, -30, 0],
                    y: [0, -40, 30, 0],
                    scale: [1, 1.1, 0.95, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Aurora / Nebula Layer 2 (Cyan/Teal - Subtle) */}
            <motion.div
                className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-15"
                style={{
                    background: 'radial-gradient(circle, rgba(0, 139, 139, 0.3) 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, -40, 20, 0],
                    y: [0, 30, -50, 0],
                    scale: [1, 1.05, 0.9, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Aurora / Nebula Layer 3 (Silver/White - Highlight) */}
            <motion.div
                className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full blur-[90px] opacity-10"
                style={{
                    background: 'radial-gradient(circle, rgba(192, 192, 192, 0.4) 0%, transparent 70%)',
                }}
                animate={{
                    x: [0, 30, -30, 0],
                    y: [0, -50, 40, 0],
                    scale: [1, 1.2, 0.85, 1],
                }}
                transition={{
                    duration: 28,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
            />

            {/* Heavy Grain Overlay for Film Look */}
            <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay"
                style={{
                    backgroundImage: 'url("/noise.png")',
                    backgroundRepeat: 'repeat',
                }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
        </div>
    );
}
