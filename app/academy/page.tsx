'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import WaitlistForm from '@/components/academy/WaitlistForm';

import TextTransition from '@/components/ui/TextTransition';

export default function AcademyPage() {
    const { t, isRTL } = useLanguage();

    const features = [
        { icon: "🎓", title: { en: "Mastery", ar: "إتقان" }, desc: { en: "Advanced retention strategies", ar: "استراتيجيات احتفاظ متقدمة" } },
        { icon: "🧠", title: { en: "Psychology", ar: "علم نفس" }, desc: { en: "Viewer behavior analysis", ar: "تحليل سلوك المشاهد" } },
        { icon: "📈", title: { en: "Growth", ar: "نمو" }, desc: { en: "Sustainable channel scaling", ar: "توسع مستدام للقناة" } }
    ];

    return (
        <div className="flex flex-col">
            {/* Hero & Waitlist Section */}
            <section className="pt-32 md:pt-48 pb-20 overflow-hidden py-24 lg:py-32">
                <div className="container-width">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className={isRTL ? 'lg:order-2' : ''}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="inline-block px-3 py-1 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] text-[var(--color-silver)] text-xs font-bold uppercase tracking-widest mb-6">
                                    <TextTransition inline>{t('academy.subtitle')}</TextTransition>
                                </span>

                                <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-[var(--color-text-primary)] mb-8 leading-[1.05] text-glow-subtle">
                                    <TextTransition>{t('academy.comingSoon')}</TextTransition>
                                </h1>

                                <p className="text-xl md:text-2xl text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
                                    <TextTransition>{t('academy.description')}</TextTransition>
                                </p>

                                {/* Features Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
                                    {features.map((feature, i) => (
                                        <div key={i} className="p-6 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex flex-col gap-3 group hover:border-[var(--color-border-strong)] transition-all">
                                            <span className="text-2xl group-hover:scale-110 transition-transform ltr:origin-left rtl:origin-right">{feature.icon}</span>
                                            <div>
                                                <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
                                                    <TextTransition>{feature.title[isRTL ? 'ar' : 'en']}</TextTransition>
                                                </h3>
                                                <div className="text-[10px] text-[var(--color-text-secondary)] leading-tight">
                                                    <TextTransition>{feature.desc[isRTL ? 'ar' : 'en']}</TextTransition>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className={isRTL ? 'lg:order-1' : ''}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <div className="glass-panel p-10 md:p-12 rounded-3xl border border-[var(--color-border-subtle)] shadow-2xl relative overflow-hidden">
                                    {/* Background Decor */}
                                    <div className="absolute top-0 end-0 w-32 h-32 bg-[var(--color-silver)] opacity-10 rounded-full blur-3xl" />

                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-4">
                                            <TextTransition>{isRTL ? 'انضم لقائمة الانتظار' : 'Join the Waitlist'}</TextTransition>
                                        </h3>
                                        <p className="text-[var(--color-text-secondary)] text-lg mb-8 leading-relaxed">
                                            <TextTransition>{isRTL ? 'كن أول من يعرف عند الاطلاق واحصل على عرض خاص.' : 'Be the first to know when we launch and get an exclusive early-bird offer.'}</TextTransition>
                                        </p>
                                        <WaitlistForm />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
