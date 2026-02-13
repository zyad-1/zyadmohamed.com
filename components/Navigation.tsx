'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { cn } from '@/lib/utils/cn';

export default function Navigation() {
    const pathname = usePathname();
    const { t, isRTL } = useLanguage();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const navLinks = [
        { href: '/', label: t('nav.home') },
        { href: '/about', label: t('nav.about') },
        { href: '/academy', label: t('nav.academy') },
        { href: '/brief', label: t('nav.brief') },
    ];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent',
                isScrolled ? 'bg-[rgba(5,5,5,0.8)] backdrop-blur-xl border-[var(--color-border-subtle)] py-3' : 'bg-transparent py-5'
            )}
        >
            <div className="container-width flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="relative z-10 group" aria-label="Home">
                    <span className="text-xl font-bold text-[var(--color-text-primary)] font-display tracking-tight flex items-center gap-1.5">
                        ZYAD
                        <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors duration-300">
                            .CREATIVE
                        </span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <ul className="flex items-center gap-1">
                        {navLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                                        pathname === link.href
                                            ? 'text-[var(--color-text-primary)] bg-[var(--color-surface-hover)]'
                                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-card)]'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="h-4 w-[1px] bg-[var(--color-border-subtle)] mx-2" />
                    <LanguageToggle />
                </nav>

                {/* Mobile Actions */}
                <div className="flex items-center gap-4 md:hidden">
                    <LanguageToggle />

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
                        aria-label="Toggle menu"
                    >
                        <div className="w-5 h-4 relative flex flex-col justify-between">
                            <motion.span
                                className="w-full h-0.5 bg-white rounded-full ltr:origin-left rtl:origin-right"
                                animate={isMobileMenuOpen ? { rotate: 45, y: -2 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.3 }}
                            />
                            <motion.span
                                className="w-full h-0.5 bg-white rounded-full"
                                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            />
                            <motion.span
                                className="w-full h-0.5 bg-white rounded-full ltr:origin-left rtl:origin-right"
                                animate={isMobileMenuOpen ? { rotate: -45, y: 2 } : { rotate: 0, y: 0 }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: '100vh' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 top-[60px] z-40 bg-[var(--color-obsidian)] md:hidden border-t border-[var(--color-border-subtle)]"
                    >
                        <div className="container-width py-8 flex flex-col gap-6">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            'block text-3xl font-display font-bold py-2',
                                            pathname === link.href
                                                ? 'text-[var(--color-text-primary)]'
                                                : 'text-[var(--color-text-secondary)]'
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
