'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import TextTransition from '@/components/ui/TextTransition';

export default function AboutPage() {
    const { translations, isRTL } = useLanguage();
    const about = translations.about;

    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start']
    });

    const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
    const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);

    const fadeInUp = {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-100px' },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
    };

    const staggerContainer = {
        initial: {},
        whileInView: { transition: { staggerChildren: 0.08 } },
        viewport: { once: true, margin: '-100px' }
    };

    const impactItems = about.impact?.items || [];
    const diffBullets = about.differentiation?.bullets || [];
    const skillCategories = [
        { key: 'creative' as const, label: 'Creative' },
        { key: 'technical' as const, label: 'Technical' },
        { key: 'strategic' as const, label: 'Strategic' }
    ];


    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50">

            {/* HERO SECTION */}
            <section
                id="hero"
                ref={heroRef}
                className="relative min-h-screen flex items-center overflow-hidden pt-20"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/30 via-neutral-950/60 to-neutral-950 pointer-events-none z-10" />

                <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 py-24 relative z-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

                    {/* Text Column */}
                    <motion.div
                        className="space-y-8 lg:space-y-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-sm text-neutral-400 text-xs font-semibold uppercase tracking-widest">
                                <TextTransition inline>{about.profession || 'Video Editor & Motion Designer'}</TextTransition>
                            </span>
                        </motion.div>

                        <motion.h1
                            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[0.95]"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                        >
                            <TextTransition>{about.hero?.headline || 'Turning videos into structured stories'}</TextTransition>
                        </motion.h1>

                        <motion.p
                            className="text-xl sm:text-2xl lg:text-3xl text-neutral-400 leading-relaxed max-w-xl"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            <TextTransition>{about.hero?.subheadline || '3+ years crafting high-retention content for top creators'}</TextTransition>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            <Link href="/brief">
                                <Button
                                    size="lg"
                                    className="rounded-full px-10 h-14 text-base font-semibold bg-neutral-50 text-neutral-950 hover:bg-neutral-200 transition-all duration-300 group"
                                >
                                    <TextTransition inline>{about.hero?.cta || 'Start a Project'}</TextTransition>
                                    <span className="inline-block ms-2 transition-transform duration-300 group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1 rtl:rotate-180">
                                        →
                                    </span>
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Image Column */}
                    <motion.div
                        className="relative w-full mx-auto lg:mx-0 lg:ms-auto"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                    >
                        <div className="absolute -inset-8 -z-10 rounded-3xl bg-gradient-to-br from-neutral-700/20 via-neutral-800/10 to-transparent blur-3xl" />

                        <motion.div
                            className="relative aspect-[870/1080] w-full overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm shadow-2xl"
                            style={{ y: imageY, scale: imageScale }}
                        >
                            <Image
                                src="/images/profile.jpg"
                                alt="Zyad - Video Editor & Motion Designer"
                                fill
                                sizes="(max-width: 768px) 90vw, (max-width: 1024px) 50vw, 870px"
                                className="object-cover"
                                priority
                                quality={90}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* PHILOSOPHY SECTION */}
            <section id="philosophy" className="py-32 lg:py-40 border-t border-neutral-800/50">
                <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    <motion.div
                        className="max-w-4xl mx-auto text-center space-y-8"
                        {...fadeInUp}
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                            <TextTransition>{about.philosophy?.title || 'Every frame is a decision'}</TextTransition>
                        </h2>
                        <div className="text-2xl sm:text-3xl lg:text-4xl text-neutral-400 leading-relaxed font-light italic flex justify-center">
                            <TextTransition className="text-center">{about.philosophy?.text || "Great editing isn't about transitions — it's about knowing what to cut."}</TextTransition>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* IMPACT METRICS */}
            <section id="impact" className="py-24 lg:py-32 bg-neutral-900/30">
                <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    <motion.h2
                        className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-16"
                        {...fadeInUp}
                    >
                        <TextTransition>{about.impact?.title || 'By the Numbers'}</TextTransition>
                    </motion.h2>

                    <motion.div
                        className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                    >
                        {impactItems.map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                className="text-center p-8 lg:p-10 rounded-2xl border border-neutral-800/50 bg-neutral-900/20 backdrop-blur-sm hover:border-neutral-700/50 transition-colors duration-500"
                            >
                                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3">
                                    <TextTransition>{item.value}</TextTransition>
                                </div>
                                <div className="text-xs sm:text-sm text-neutral-500 uppercase tracking-wider font-semibold">
                                    <TextTransition>{item.label}</TextTransition>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* DIFFERENTIATION */}
            <section id="differentiation" className="py-24 lg:py-32">
                <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">

                        <motion.div className="space-y-8" {...fadeInUp}>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                                <TextTransition>{about.differentiation?.title || 'What Makes This Different'}</TextTransition>
                            </h2>
                            <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed">
                                <TextTransition>
                                    {about.differentiation?.narrative || "I don't just edit videos. I build custom editing systems based on niche analysis, audience psychology, and brand identity."}
                                </TextTransition>
                            </p>
                        </motion.div>

                        <motion.div
                            className="space-y-4"
                            variants={staggerContainer}
                            initial="initial"
                            whileInView="whileInView"
                            viewport={{ once: true, margin: '-100px' }}
                        >
                            {diffBullets.map((bullet, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={fadeInUp}
                                    className="flex items-start gap-4 p-5 rounded-xl border border-neutral-800/50 bg-neutral-900/20 hover:border-neutral-700/50 transition-colors duration-300"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2.5 flex-shrink-0" />
                                    <span className="text-base sm:text-lg text-neutral-300"><TextTransition>{bullet}</TextTransition></span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* SKILLS */}
            <section id="skills" className="py-24 lg:py-32 bg-neutral-900/30">
                <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
                    <motion.h2
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-16"
                        {...fadeInUp}
                    >
                        <TextTransition>{about.skills?.title || 'Expertise'}</TextTransition>
                    </motion.h2>

                    <motion.div
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                    >
                        {skillCategories.map((cat, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                className="p-8 rounded-2xl border-t-2 border-neutral-700 bg-neutral-900/30 backdrop-blur-sm hover:border-neutral-500 transition-colors duration-500"
                            >
                                <h3 className="text-2xl font-bold mb-6">
                                    <TextTransition>{about.skills?.[cat.key]?.title || cat.label}</TextTransition>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {(about.skills?.[cat.key]?.items || []).map((skill, sIdx) => (
                                        <span
                                            key={sIdx}
                                            className="px-3 py-1.5 rounded-full border border-neutral-700/50 bg-neutral-800/30 text-[10px] uppercase tracking-widest font-semibold text-neutral-400"
                                        >
                                            <TextTransition inline>{skill}</TextTransition>
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>


            {/* CLOSING CTA */}
            <section id="closing" className="relative py-40 lg:py-56 border-t border-neutral-800/50 overflow-hidden">
                {/* Ambient Background Glows */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-br from-white/[0.02] via-neutral-500/[0.03] to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-white/[0.01] rounded-full blur-3xl" />
                    <div className="absolute top-0 right-1/4 w-64 h-64 bg-neutral-400/[0.02] rounded-full blur-3xl" />
                </div>

                <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
                    <motion.div
                        className="text-center max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                    >
                        {/* Label Pill */}
                        <motion.div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-700/50 bg-neutral-900/50 backdrop-blur-sm mb-10"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-400">
                                <TextTransition inline>Available for Projects</TextTransition>
                            </span>
                        </motion.div>

                        {/* Headline with Gradient Accent */}
                        <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
                            <span className="block text-neutral-50">
                                <TextTransition inline>{about.closing?.title || "Let's Build"}</TextTransition>
                            </span>
                            <span className="block bg-gradient-to-r from-neutral-300 via-neutral-400 to-neutral-500 bg-clip-text text-transparent">
                                <TextTransition inline>Something Great</TextTransition>
                            </span>
                        </h2>

                        {/* Subtext */}
                        <p className="text-lg sm:text-xl lg:text-2xl text-neutral-500 leading-relaxed max-w-2xl mx-auto mb-14">
                            <TextTransition>{about.closing?.text || "If you're looking for an editor who thinks like a strategist and builds like a craftsman — let's talk."}</TextTransition>
                        </p>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <Link href="/brief">
                                <motion.div
                                    className="inline-flex items-center gap-3 rounded-full px-10 sm:px-14 py-5 sm:py-6 text-lg sm:text-xl font-semibold bg-neutral-50 text-neutral-950 cursor-pointer shadow-[0_0_60px_-15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_-15px_rgba(255,255,255,0.25)] transition-shadow duration-500"
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                >
                                    <TextTransition inline>{about.closing?.cta || 'Start a Collaboration'}</TextTransition>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </motion.div>
                            </Link>
                        </motion.div>

                        {/* Trust Line */}
                        <motion.p
                            className="mt-10 text-xs uppercase tracking-[0.25em] text-neutral-600 font-medium"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.5 }}
                        >
                            Trusted by 7-figure entrepreneurs worldwide
                        </motion.p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}