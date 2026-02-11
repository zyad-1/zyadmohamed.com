'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

import TextTransition from '@/components/ui/TextTransition';

export default function WaitlistForm() {
    const { t, isRTL } = useLanguage();
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitted(true);
        setIsLoading(false);
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 px-4 rounded-2xl bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.2)]"
            >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h4 className="text-[var(--color-text-primary)] font-bold mb-1">Success!</h4>
                <p className="text-[var(--color-text-secondary)] text-sm">
                    <TextTransition>{t('academy.success')}</TextTransition>
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="flex flex-col gap-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('academy.placeholder')}
                    required
                    className="w-full px-6 py-4 rounded-2xl bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-silver-dim)] focus:outline-none focus:border-[var(--color-border-strong)] transition-all"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                />

                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full rounded-2xl"
                    size="lg"
                >
                    <TextTransition inline>{t('academy.cta')}</TextTransition>
                </Button>
            </div>

            <p className="text-[10px] text-[var(--color-silver-dim)] text-center uppercase tracking-widest font-bold">
                No spam. Only high-value engineering updates.
            </p>
        </form>
    );
}
