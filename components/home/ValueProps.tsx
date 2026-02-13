'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import TextTransition from '@/components/ui/TextTransition';

export default function ValueProps() {
    const { t } = useLanguage();

    const features = [
        {
            title: t('valueProps.retention.title'),
            description: t('valueProps.retention.description'),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            title: t('valueProps.conversion.title'),
            description: t('valueProps.conversion.description'),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: t('valueProps.platform.title'),
            description: t('valueProps.platform.description'),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
            )
        }
    ];

    return (
        <section className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] relative py-24 lg:py-32">
            <div className="container-width">
                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="glass-panel p-8 rounded-2xl hover:border-[var(--color-border-strong)] transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-hover)] flex items-center justify-center text-[var(--color-text-primary)] mb-6 group-hover:bg-[var(--color-surface-card)] transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-[var(--color-text-primary)]">
                                <TextTransition>{feature.title}</TextTransition>
                            </h3>
                            <div className="text-[var(--color-text-secondary)] leading-relaxed">
                                <TextTransition>{feature.description}</TextTransition>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
