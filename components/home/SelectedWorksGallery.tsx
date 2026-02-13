'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import ScrollReveal from '@/components/ui/ScrollReveal';

// Sample works data - placeholder for actual portfolio items
const works = [
    {
        id: 1,
        title: 'Brand Launch Campaign',
        client: '@luxurybrand',
        views: '2.4M',
        retention: '72%',
        thumbnail: null, // Will use gradient placeholder
    },
    {
        id: 2,
        title: 'Product Showcase',
        client: '@techstartup',
        views: '1.8M',
        retention: '68%',
        thumbnail: null,
    },
    {
        id: 3,
        title: 'Personal Brand Intro',
        client: '@entrepreneur',
        views: '3.1M',
        retention: '75%',
        thumbnail: null,
    },
    {
        id: 4,
        title: 'Course Announcement',
        client: '@coach',
        views: '890K',
        retention: '71%',
        thumbnail: null,
    },
    {
        id: 5,
        title: 'Service Reveal',
        client: '@agency',
        views: '1.2M',
        retention: '69%',
        thumbnail: null,
    },
];

interface WorkCardProps {
    work: typeof works[0];
    index: number;
}

function WorkCard({ work, index }: WorkCardProps) {
    const { isRTL } = useLanguage();

    return (
        <motion.div
            className="relative w-[280px] md:w-[320px] flex-shrink-0"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: index * 0.08,
            }}
        >
            <motion.div
                className="relative overflow-hidden rounded-2xl glass-card group cursor-pointer"
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
            >
                {/* Video Thumbnail / Placeholder */}
                <div className="relative aspect-[9/16] overflow-hidden">
                    {/* Gradient Placeholder */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(135deg, 
                rgba(20, 20, 20, 1) 0%, 
                rgba(40, 40, 40, 1) 50%, 
                rgba(20, 20, 20, 1) 100%)`,
                        }}
                    />

                    {/* Soft static highlight texture */}
                    <div
                        className="absolute inset-0 opacity-40"
                        style={{
                            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(192, 192, 192, 0.12) 0%, transparent 55%),
                radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.06) 0%, transparent 45%)`,
                        }}
                    />

                    {/* Play Button */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: 'rgba(3, 3, 3, 0.45)' }}
                    >
                        <motion.div
                            className="w-16 h-16 rounded-full flex items-center justify-center"
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <svg
                                className={`w-6 h-6 text-white ${isRTL ? '' : 'ml-1'}`}
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </motion.div>
                    </motion.div>

                    {/* Stats Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-white font-medium text-sm">{work.title}</p>
                                <p className="text-liquid-silver text-xs">{work.client}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white text-sm font-semibold">{work.views}</p>
                                <p className="text-liquid-silver text-xs">Views</p>
                            </div>
                        </div>
                    </div>

                    {/* Retention Badge */}
                    <motion.div
                        className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                        }}
                        whileHover={{ scale: 1.02 }}
                    >
                        {work.retention} Retention
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function SelectedWorksGallery() {
    const { t, isRTL } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollXProgress } = useScroll({ container: containerRef });

    return (
        <section className="section relative overflow-hidden">
            <div className="container mb-8 md:mb-12">
                <ScrollReveal>
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h2 className="text-white mb-2">
                                {t('works.title')}
                            </h2>
                            <p className="text-liquid-silver opacity-80">
                                {t('works.subtitle')}
                            </p>
                        </div>

                        {/* Scroll Indicator */}
                        <div className="hidden md:flex items-center gap-3 text-liquid-silver text-sm">
                            <span>{isRTL ? 'اسحب' : 'Scroll'}</span>
                            <motion.div
                                className={`w-8 h-8 rounded-full border border-liquid-silver/30 flex items-center justify-center ${isRTL ? 'rotate-180' : ''}`}
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </motion.div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* Horizontal Scroll Gallery */}
            <div
                ref={containerRef}
                className="horizontal-scroll px-6 md:px-12 lg:px-24 pb-4"
                style={{ direction: 'ltr' }} // Force LTR for consistent scroll behavior
            >
                {/* Add some initial padding */}
                <div className="w-4 flex-shrink-0" />

                {works.map((work, index) => (
                    <WorkCard key={work.id} work={work} index={index} />
                ))}

                {/* View All Card */}
                <motion.div
                    className="relative w-[280px] md:w-[320px] flex-shrink-0"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <motion.div
                        className="relative aspect-[9/16] overflow-hidden rounded-2xl glass-card flex items-center justify-center cursor-pointer group"
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        <div className="text-center p-6">
                            <motion.div
                                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                style={{
                                    border: '1px solid rgba(192, 192, 192, 0.3)',
                                }}
                                whileHover={{ scale: 1.05, borderColor: 'rgba(255, 255, 255, 0.5)' }}
                            >
                                <svg className="w-6 h-6 text-liquid-silver group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                </svg>
                            </motion.div>
                            <p className="text-liquid-silver group-hover:text-white transition-colors font-medium">
                                {t('works.viewProject')}
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* End padding */}
                <div className="w-4 flex-shrink-0" />
            </div>

            {/* Progress Bar */}
            <div className="container mt-6">
                <div className="h-0.5 bg-glass-border rounded-full overflow-hidden max-w-xs mx-auto">
                    <motion.div
                        className="h-full bg-liquid-silver rounded-full"
                        style={{
                            scaleX: scrollXProgress,
                            transformOrigin: isRTL ? 'right' : 'left',
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
