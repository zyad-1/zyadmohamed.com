'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/lib/i18n/translations/en.json';
import ar from '@/lib/i18n/translations/ar.json';

type Language = 'en' | 'ar';
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    translations: Translations;
    toggleLanguage: () => void;
    t: (key: string) => string;
    isRTL: boolean;
    isTransitioning: boolean;
}

const translations: Record<Language, Translations> = { en, ar };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage = 'en' }: { children: React.ReactNode, initialLanguage?: Language }) {
    const [language, setLanguage] = useState<Language>(initialLanguage);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Sync with localStorage if cookie was missing or for redundancy
        const saved = localStorage.getItem('language') as Language;
        if (saved && saved !== language && !document.cookie.includes('language=')) {
            setLanguage(saved);
            // document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'; // Disabled for Hybrid i18n
            document.documentElement.lang = saved;
        }
    }, []);

    const toggleLanguage = useCallback(() => {
        setIsTransitioning(true);

        // Smooth transition timing
        setTimeout(() => {
            setLanguage(prev => {
                const next = prev === 'en' ? 'ar' : 'en';
                // Update persistent storage
                localStorage.setItem('language', next);
                document.cookie = `language=${next}; path=/; max-age=31536000`; // 1 year

                // Update DOM lang only, keep dir="ltr" for stable layout
                document.documentElement.lang = next;

                return next;
            });

            // Finish transition after DOM updates
            setTimeout(() => {
                setIsTransitioning(false);
            }, 100);
        }, 300); // 300ms fade out duration
    }, []);

    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let value: unknown = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    }, [language]);

    const isRTL = language === 'ar';

    return (
        <LanguageContext.Provider value={{
            language,
            translations: translations[language],
            toggleLanguage,
            t,
            isRTL,
            isTransitioning
        }}>
            <div
                className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            >
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
