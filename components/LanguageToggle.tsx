'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function LanguageToggle() {
    const { language, toggleLanguage, t, isTransitioning } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            disabled={isTransitioning}
            className={`
                relative h-9 rounded-full flex items-center 
                bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)] 
                backdrop-blur-md overflow-hidden group cursor-pointer
                transition-opacity duration-300
                px-1
                w-[86px]
                ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
            `}
            aria-label={t('language.toggle')}
            aria-pressed={language === 'ar'}
            role="switch"
            dir="ltr"
        >
            {/* Liquid Glow Background on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Sliding Indicator */}
            <motion.div
                className="absolute top-1 bottom-1 w-[38px] rounded-full bg-white shadow-lg pointer-events-none"
                initial={false}
                animate={{
                    x: language === 'en' ? 0 : 38
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />

            {/* Text Labels */}
            <div className="relative z-10 flex w-full justify-between px-2 text-[10px] font-bold tracking-[0.15em]">
                <span className={`transition-colors duration-300 ${language === 'en' ? 'text-black' : 'text-[var(--color-silver-dim)]'}`}>
                    EN
                </span>
                <span className={`transition-colors duration-300 ${language === 'ar' ? 'text-black' : 'text-[var(--color-silver-dim)]'}`}>
                    AR
                </span>
            </div>
        </button>
    );
}
