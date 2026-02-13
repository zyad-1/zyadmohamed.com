'use client';

import { Button, buttonBaseStyles, buttonVariants, buttonSizes } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import TextTransition from '@/components/ui/TextTransition';

export default function SelectedWorks() {
    const { t, language, isRTL } = useLanguage();

    // Sample works data with keys mapped to translation
    const works = [
        {
            id: 1,
            title: t('selectedWorks.works.brandLaunch.title'),
            client: t('selectedWorks.works.brandLaunch.client'),
            views: '2.4M',
            retention: '72%',
        },
        {
            id: 2,
            title: t('selectedWorks.works.productShowcase.title'),
            client: t('selectedWorks.works.productShowcase.client'),
            views: '1.8M',
            retention: '68%',
        },
        {
            id: 3,
            title: t('selectedWorks.works.personalBrand.title'),
            client: t('selectedWorks.works.personalBrand.client'),
            views: '3.1M',
            retention: '75%',
        },
        {
            id: 4,
            title: t('selectedWorks.works.courseAnnouncement.title'),
            client: t('selectedWorks.works.courseAnnouncement.client'),
            views: '890K',
            retention: '71%',
        }
    ];

    return (
        <section className="relative z-10 py-24 lg:py-32" id="works">
            <div className="container-width">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-[var(--color-text-primary)] mb-4">
                            <TextTransition>{t('selectedWorks.title')}</TextTransition>
                        </h2>
                        <div className="text-[var(--color-text-secondary)] max-w-lg">
                            <TextTransition>{t('selectedWorks.subtitle')}</TextTransition>
                        </div>
                    </div>
                    <Link href="/brief" className={cn(buttonBaseStyles, buttonVariants.outline, buttonSizes.md)}>
                        <TextTransition inline>{t('selectedWorks.cta')}</TextTransition>
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {works.map((work, index) => (
                        <motion.div
                            key={work.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="group relative aspect-video rounded-2xl overflow-hidden bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] transition-all"
                        >
                            {/* Gradient Placeholder (Replace with Image later) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-obsidian)] to-[var(--color-surface-hover)]" />

                            {/* Overlay */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 transition-opacity group-hover:opacity-100">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                    <h3 className="text-xl font-bold text-white mb-1">
                                        <TextTransition>{work.title}</TextTransition>
                                    </h3>
                                    <div className="text-[var(--color-text-secondary)] text-sm mb-4">
                                        <TextTransition>{work.client}</TextTransition>
                                    </div>

                                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                        <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white border border-white/20">
                                            {work.views} <TextTransition inline>{t('selectedWorks.labels.views')}</TextTransition>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white border border-white/20">
                                            {work.retention} <TextTransition inline>{t('selectedWorks.labels.retention')}</TextTransition>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hover Icon */}
                            <div className="absolute top-1/2 start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
