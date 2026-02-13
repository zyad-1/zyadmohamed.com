'use client';

import HeroSection from '@/components/home/HeroSection';
import ValueProps from '@/components/home/ValueProps';
import SelectedWorks from '@/components/home/SelectedWorks';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ValueProps />
      <SelectedWorks />
    </>
  );
}
