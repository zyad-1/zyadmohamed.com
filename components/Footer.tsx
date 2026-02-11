'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
    const { t, isRTL } = useLanguage();
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { name: 'Twitter / X', href: '#', icon: 'X' },
        { name: 'LinkedIn', href: '#', icon: 'IN' },
        { name: 'Instagram', href: '#', icon: 'IG' },
    ];

    const navLinks = [
        { label: t('nav.home'), href: '/' },
        { label: t('nav.about'), href: '/about' },
        { label: t('nav.academy'), href: '/academy' },
        { label: t('nav.brief'), href: '/brief' },
    ];

    return (
        <footer className="relative border-t border-[var(--color-border-subtle)] bg-[rgba(5,5,5,0.4)] backdrop-blur-md mt-20">
            <div className="container-width py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24">
                    {/* Brand Column */}
                    <div className="md:col-span-2 space-y-8">
                        <Link href="/" className="inline-block group">
                            <span className="text-2xl font-bold text-[var(--color-text-primary)] font-display tracking-tight flex items-center gap-1.5">
                                ZYAD
                                <span className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors duration-300">
                                    .CREATIVE
                                </span>
                            </span>
                        </Link>
                        <p className="text-[var(--color-text-secondary)] max-w-sm leading-relaxed text-base">
                            High-ticket video engineering for 7-figure entrepreneurs. I don't just edit. I build Money Machines.
                        </p>

                        {/* Social Links Row */}
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-hover)] transition-all duration-300"
                                    aria-label={social.name}
                                >
                                    <span className="text-xs font-bold">{social.icon}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Sitemap */}
                    <div className="space-y-6">
                        <h3 className="text-[var(--color-text-primary)] font-display font-bold uppercase tracking-widest text-xs">
                            Navigation
                        </h3>
                        <ul className="space-y-4">
                            {navLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact/Status */}
                    <div className="space-y-6">
                        <h3 className="text-[var(--color-text-primary)] font-display font-bold uppercase tracking-widest text-xs">
                            Availability
                        </h3>
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                    Q1 Vacancy: 1 Spot
                                </span>
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                Currently booking for mid-late February 2026.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-[var(--color-border-subtle)] flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[var(--color-silver-dim)] text-sm font-medium">
                        © {currentYear} ZYAD.CREATIVE
                    </p>
                    <div className="flex gap-8">
                        <Link href="/privacy" className="text-[var(--color-text-secondary)] hover:text-[var(--color-silver)] transition-colors text-sm">
                            Privacy
                        </Link>
                        <Link href="/terms" className="text-[var(--color-text-secondary)] hover:text-[var(--color-silver)] transition-colors text-sm">
                            Terms
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
