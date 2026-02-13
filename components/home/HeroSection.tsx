'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import TextTransition from '@/components/ui/TextTransition';

export default function HeroSection() {
    const { t, isRTL } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section
            ref={containerRef}
            className="min-h-screen flex items-center justify-center relative overflow-hidden pt-32 pb-20 py-24 lg:py-32"
        >
            <div className="container-width relative z-10 flex flex-col items-center text-center">

                {/* Status Pill */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--color-border-subtle)] backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <TextTransition inline className="text-xs font-medium text-[var(--color-silver)] uppercase tracking-wider">
                            Accepting New Clients
                        </TextTransition>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="mb-6 leading-[1.1]">
                        <span className="block text-[var(--color-silver)] opacity-90 text-4xl md:text-5xl lg:text-6xl font-medium mb-2">
                            <TextTransition inline>{t('hero.headline')}</TextTransition>
                        </span>
                        <span className="block text-[var(--color-white)] text-5xl md:text-7xl lg:text-8xl tracking-tight text-glow-subtle">
                            <TextTransition inline>{t('hero.headlineBold')}</TextTransition>
                        </span>
                    </h1>
                </motion.div>

                {/* Subheadline */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed flex justify-center">
                        <TextTransition className="text-center">
                            {t('hero.subheadline')}
                        </TextTransition>
                    </div>
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                >
                    <Link href="/brief">
                        <Button size="lg" className="min-w-[180px] rounded-full text-base">
                            <TextTransition inline>{t('hero.cta')}</TextTransition>
                        </Button>
                    </Link>
                    <Link href="/academy">
                        <Button variant="ghost" size="lg" className="min-w-[180px] rounded-full text-base">
                            <TextTransition inline>View Academy</TextTransition>
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
