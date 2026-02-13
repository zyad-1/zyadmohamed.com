import Link from 'next/link';
import MagneticButton from '@/components/ui/MagneticButton';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Liquid Effect */}
            <div className="absolute inset-0 bg-obsidian z-[-1]" />

            <div className="container text-center px-4 relative z-10">
                <h1 className="text-[8rem] md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent opacity-20 select-none">
                    404
                </h1>

                <div className="glass-card p-8 md:p-12 max-w-lg mx-auto transform -translate-y-12 backdrop-blur-3xl border-white/10">
                    <h2 className="text-3xl md:text-4xl text-white mb-4">
                        Signal Lost
                    </h2>
                    <p className="text-liquid-silver mb-8 text-lg">
                        The page you are looking for has been dissolved into the void.
                    </p>

                    <MagneticButton href="/" variant="filled" size="lg">
                        Return to Base
                    </MagneticButton>
                </div>
            </div>
        </div>
    );
}
