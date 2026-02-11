'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

import TextTransition from '@/components/ui/TextTransition';

interface FormData {
    name: string;
    handle: string;
    retentionCost: string;
    budgetTier: string;
}

const budgetTiers = [
    { id: 'tier1', value: '$2k-$5k', label: { en: 'Foundation', ar: 'التأسيس' } },
    { id: 'tier2', value: '$5k-$10k', label: { en: 'Growth', ar: 'النمو' } },
    { id: 'tier3', value: '$10k+', label: { en: 'Enterprise', ar: 'المؤسسة' } },
];

export default function BriefPage() {
    const { t, isRTL, language } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        handle: '',
        retentionCost: '',
        budgetTier: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const totalSteps = 4;

    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: return formData.name.trim().length > 0;
            case 1: return formData.handle.trim().length > 0;
            case 2: return formData.retentionCost.trim().length > 0;
            case 3: return formData.budgetTier.length > 0;
            default: return false;
        }
    };

    // Success Screen
    if (isSubmitted) {
        return (
            <section className="min-h-screen flex items-center pt-32 pb-20 py-24 lg:py-32">
                <div className="container-width max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-12 rounded-[40px] border border-[var(--color-border-subtle)] text-center shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500 opacity-5 rounded-full blur-[100px]" />

                        <div className="relative z-10">
                            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-4xl font-display font-bold text-[var(--color-text-primary)] mb-4">
                                <TextTransition>{t('brief.successTitle')}</TextTransition>
                            </h2>

                            <p className="text-[var(--color-text-secondary)] text-lg mb-12 leading-relaxed max-w-sm mx-auto">
                                <TextTransition className="text-center">{t('brief.successMessage')}</TextTransition>
                            </p>

                            <Link href="/">
                                <Button variant="outline" size="lg" className="rounded-full px-12">
                                    <TextTransition inline>{isRTL ? 'العودة للرئيسية' : 'Return Home'}</TextTransition>
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        );
    }

    const inputClasses = "w-full text-2xl md:text-4xl font-display font-bold bg-transparent border-b-2 border-[var(--color-border-subtle)] py-6 text-[var(--color-text-primary)] placeholder-[var(--color-silver-dim)]/30 focus:outline-none focus:border-[var(--color-text-primary)] transition-colors";
    const textareaClasses = "w-full text-xl md:text-2xl bg-[var(--color-surface-hover)] p-8 rounded-3xl border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] placeholder-[var(--color-silver-dim)]/50 focus:outline-none focus:border-[var(--color-border-strong)] transition-all min-h-[250px] resize-none";

    return (
        <section className="min-h-screen pt-32 pb-20 py-24 lg:py-32">
            <div className="container-width max-w-4xl">
                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-[var(--color-text-primary)] shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-[var(--color-border-subtle)]'}`}
                            />
                        ))}
                    </div>

                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <span className="text-[var(--color-silver-dim)] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">
                            <TextTransition inline>Question {currentStep + 1} / {totalSteps}</TextTransition>
                        </span>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-[var(--color-text-primary)] leading-[1.2]">
                            <TextTransition>
                                {currentStep === 0 && t('brief.step1Title')}
                                {currentStep === 1 && t('brief.step2Title')}
                                {currentStep === 2 && t('brief.step3Title')}
                                {currentStep === 3 && t('brief.step4Title')}
                            </TextTransition>
                        </h1>
                    </motion.div>
                </div>

                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {currentStep === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full"
                            >
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder={t('brief.step1Placeholder')}
                                    className={inputClasses}
                                    autoFocus
                                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                                />
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <input
                                    type="text"
                                    value={formData.handle}
                                    onChange={(e) => updateField('handle', e.target.value)}
                                    placeholder={t('brief.step2Placeholder')}
                                    className={inputClasses}
                                    autoFocus
                                    style={{ direction: 'ltr' }} // Handles are usually English/LTR
                                />
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <textarea
                                    value={formData.retentionCost}
                                    onChange={(e) => updateField('retentionCost', e.target.value)}
                                    placeholder={t('brief.step3Placeholder')}
                                    className={textareaClasses}
                                    autoFocus
                                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                                />
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid gap-4"
                            >
                                {budgetTiers.map((tier) => (
                                    <button
                                        key={tier.id}
                                        type="button"
                                        onClick={() => updateField('budgetTier', tier.value)}
                                        className={`p-8 rounded-3xl border-2 text-start transition-all group relative overflow-hidden ${formData.budgetTier === tier.value
                                            ? 'border-[var(--color-text-primary)] bg-[var(--color-surface-hover)]'
                                            : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-strong)]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <p className="text-2xl font-display font-bold text-[var(--color-text-primary)] mb-1">
                                                    {tier.value}
                                                </p>
                                                <p className="text-[var(--color-text-secondary)] text-sm font-medium uppercase tracking-widest">
                                                    <TextTransition inline>{tier.label[language]}</TextTransition>
                                                </p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 transition-colors ${formData.budgetTier === tier.value
                                                ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
                                                : 'border-[var(--color-border-subtle)]'
                                                }`}>
                                                {formData.budgetTier === tier.value && (
                                                    <svg className="w-full h-full text-black p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-20 flex items-center justify-between">
                    <div>
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold uppercase tracking-widest text-xs flex items-center gap-2 px-4 py-2 transition-colors"
                            >
                                <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <TextTransition inline>{t('brief.back')}</TextTransition>
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {currentStep < totalSteps - 1 ? (
                            <Button
                                size="lg"
                                className="rounded-full px-12 group"
                                onClick={handleNext}
                                disabled={!canProceed()}
                            >
                                <TextTransition inline>{t('brief.next')}</TextTransition>
                                <svg className="w-4 h-4 ms-2 transition-transform group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                className="rounded-full px-12"
                                onClick={handleSubmit}
                                isLoading={isSubmitting}
                                disabled={!canProceed()}
                            >
                                <TextTransition inline>{t('brief.submit')}</TextTransition>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
