'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import Clarity from '@microsoft/clarity';

const CLARITY_PROJECT_ID = 'vdw3ceml6f';
const GA_MEASUREMENT_ID = 'G-CHJWWWG9EN';

// Easy toggle for development mode
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ENABLE_ANALYTICS = IS_PRODUCTION || true; // Set to true to force enable in dev for testing

export default function Analytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!ENABLE_ANALYTICS) return;

        // Initialize Microsoft Clarity
        try {
            Clarity.init(CLARITY_PROJECT_ID);
        } catch (error) {
            console.error('Clarity initialization failed:', error);
        }
    }, []);

    useEffect(() => {
        if (!ENABLE_ANALYTICS || !pathname) return;

        // Track page views in GA4 on route change
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('config', GA_MEASUREMENT_ID, {
                page_path: pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : ''),
            });
        }
    }, [pathname, searchParams]);

    if (!ENABLE_ANALYTICS) return null;

    return (
        <>
            {/* Google Analytics 4 */}
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
            </Script>

            {/* Future: Meta Pixel, TikTok Pixel, etc. */}
        </>
    );
}
