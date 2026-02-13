'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import ScrollReveal from '@/components/ui/ScrollReveal';
import LiquidGlassCard from '@/components/ui/LiquidGlassCard';

// Retention data - demonstrating the dramatic difference
const retentionData = [
    { second: 0, standard: 100, engineered: 100 },
    { second: 1, standard: 85, engineered: 98 },
    { second: 2, standard: 65, engineered: 95 },
    { second: 3, standard: 45, engineered: 92 },
    { second: 5, standard: 32, engineered: 85 },
    { second: 8, standard: 24, engineered: 78 },
    { second: 12, standard: 18, engineered: 72 },
    { second: 18, standard: 14, engineered: 68 },
    { second: 25, standard: 10, engineered: 66 },
    { second: 30, standard: 8, engineered: 65 },
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div
                className="px-4 py-3 rounded-lg"
                style={{
                    background: 'rgba(3, 3, 3, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(192, 192, 192, 0.2)',
                }}
            >
                <p className="text-liquid-silver text-sm mb-2">
                    {label}s
                </p>
                {payload.map((entry: any, index: number) => (
                    <p
                        key={index}
                        className="text-sm font-medium"
                        style={{ color: entry.color }}
                    >
                        {entry.name}: {entry.value}%
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function RetentionGraph() {
    const { t, isRTL } = useLanguage();
    const ref = useRef<HTMLDivElement>(null);
    // Use a stricter margin to ensure it's well within view before starting
    const isInView = useInView(ref, { once: true, margin: "-100px 0px -100px 0px" });
    const [hasAnimated, setHasAnimated] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Trigger animation when section comes into view
    useEffect(() => {
        if (isInView && !hasAnimated) {
            const timer = setTimeout(() => {
                setHasAnimated(true);
            }, 200); // Small delay to settle
            return () => clearTimeout(timer);
        }
    }, [isInView, hasAnimated]);

    return (
        <section ref={ref} className="section relative overflow-hidden">
            <div className="container">
                <ScrollReveal>
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-white mb-4">
                            {t('retention.title')}
                        </h2>
                        <p className="text-xl text-liquid-silver opacity-80 max-w-2xl mx-auto">
                            {t('retention.subtitle')}
                        </p>
                    </div>
                </ScrollReveal>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Chart */}
                    <ScrollReveal delay={0.2} className={isRTL ? 'lg:order-2' : ''}>
                        <LiquidGlassCard variant="strong" className="overflow-hidden">
                            <div className="h-[350px] md:h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={retentionData}
                                        margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(192, 192, 192, 0.1)"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="second"
                                            stroke="#808080"
                                            tickLine={false}
                                            axisLine={{ stroke: 'rgba(192, 192, 192, 0.2)' }}
                                            tick={{ fill: '#808080', fontSize: 12 }}
                                            label={{
                                                value: t('retention.timeSeconds'),
                                                position: 'bottom',
                                                fill: '#808080',
                                                fontSize: 12,
                                                offset: 0
                                            }}
                                        />

                                        <YAxis
                                            stroke="#808080"
                                            tickLine={false}
                                            axisLine={{ stroke: 'rgba(192, 192, 192, 0.2)' }}
                                            tick={{ fill: '#808080', fontSize: 12 }}
                                            domain={[0, 100]}
                                            tickFormatter={(value) => `${value}%`}
                                            label={{
                                                value: t('retention.viewerRetention'),
                                                angle: -90,
                                                position: 'insideLeft',
                                                fill: '#808080',
                                                fontSize: 12,
                                                style: { textAnchor: 'middle' }
                                            }}
                                        />

                                        <Tooltip content={<CustomTooltip />} />

                                        {/* 3-second critical line */}
                                        <ReferenceLine
                                            x={3}
                                            stroke="rgba(192, 192, 192, 0.3)"
                                            strokeDasharray="5 5"
                                            label={{
                                                value: '3s',
                                                position: 'top',
                                                fill: '#808080',
                                                fontSize: 11,
                                            }}
                                        />

                                        {/* Standard Content Line - dim gray, drops off sharply */}
                                        <Line
                                            type="monotone"
                                            dataKey="standard"
                                            name={t('retention.standardLabel')}
                                            stroke="#808080"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{
                                                r: 6,
                                                fill: '#808080',
                                                stroke: '#030303',
                                                strokeWidth: 2
                                            }}
                                            animationDuration={hasAnimated ? 2500 : 0}
                                            animationBegin={hasAnimated ? 300 : 0}
                                        />

                                        {/* Retention-Engineered Line - glowing white, sustained */}
                                        <Line
                                            type="monotone"
                                            dataKey="engineered"
                                            name={t('retention.engineeredLabel')}
                                            stroke="#FFFFFF"
                                            strokeWidth={3}
                                            dot={false}
                                            activeDot={{
                                                r: 8,
                                                fill: '#FFFFFF',
                                                stroke: '#030303',
                                                strokeWidth: 2
                                            }}
                                            animationDuration={hasAnimated ? 2500 : 0}
                                            animationBegin={hasAnimated ? 800 : 0}
                                            style={{
                                                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))',
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Legend */}
                            <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-glass-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-1 bg-dim-gray rounded" />
                                    <span className="text-sm text-dim-gray">
                                        {t('retention.standardLabel')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-1 bg-white rounded"
                                        style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)' }}
                                    />
                                    <span className="text-sm text-white">
                                        {t('retention.engineeredLabel')}
                                    </span>
                                </div>
                            </div>
                        </LiquidGlassCard>
                    </ScrollReveal>

                    {/* Description */}
                    <ScrollReveal delay={0.4} className={isRTL ? 'lg:order-1' : ''}>
                        <div className="space-y-6">
                            <p className="text-lg md:text-xl text-liquid-silver leading-relaxed">
                                {t('retention.description')}
                            </p>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <motion.div
                                    className="glass-card p-6 text-center"
                                    whileHover={{ scale: 1.03, y: -3 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                >
                                    <motion.div
                                        className="text-4xl md:text-5xl font-bold text-white text-glow mb-2"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={hasAnimated ? { opacity: 1, scale: 1 } : {}}
                                        transition={{ delay: 1.2, type: "spring", stiffness: 100, damping: 20 }}
                                    >
                                        8×
                                    </motion.div>
                                    <p className="text-sm text-liquid-silver">
                                        {isRTL ? 'نسبة احتفاظ أعلى' : 'Higher Retention'}
                                    </p>
                                </motion.div>

                                <motion.div
                                    className="glass-card p-6 text-center"
                                    whileHover={{ scale: 1.03, y: -3 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                >
                                    <motion.div
                                        className="text-4xl md:text-5xl font-bold text-white text-glow mb-2"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={hasAnimated ? { opacity: 1, scale: 1 } : {}}
                                        transition={{ delay: 1.4, type: "spring", stiffness: 100, damping: 20 }}
                                    >
                                        65%
                                    </motion.div>
                                    <p className="text-sm text-liquid-silver">
                                        {isRTL ? 'مشاهدة حتى النهاية' : 'Watch Till End'}
                                    </p>
                                </motion.div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
