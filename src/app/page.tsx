import { HeroSection } from '@/components/home/HeroSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { PowerSuiteSection } from '@/components/home/PowerSuiteSection';
import { DigitikaTeaser } from '@/components/home/DigitikaTeaser';
import { TrustSection } from '@/components/home/TrustSection';
import { CTASection } from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <PowerSuiteSection />
      <DigitikaTeaser />
      <TrustSection />
      <CTASection />
    </>
  );
}
