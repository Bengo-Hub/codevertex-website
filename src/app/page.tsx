import { HeroSection } from '@/components/home/HeroSection';
import { ClientLogosBar } from '@/components/home/ClientLogosBar';
import { ServicesSection } from '@/components/home/ServicesSection';
import { PowerSuiteSection } from '@/components/home/PowerSuiteSection';
import { DigitikaTeaser } from '@/components/home/DigitikaTeaser';
import { TrustSection } from '@/components/home/TrustSection';
import { CTASection } from '@/components/home/CTASection';

// ClientLogosBar fetches the live tenant list — refresh periodically rather than
// baking it in at build time forever.
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ClientLogosBar />
      <ServicesSection />
      <PowerSuiteSection />
      <DigitikaTeaser />
      <TrustSection />
      <CTASection />
    </>
  );
}
