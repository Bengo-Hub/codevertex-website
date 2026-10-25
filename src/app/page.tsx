import { HeroSection } from '@/components/home/HeroSection';
import { ClientLogosBar } from '@/components/home/ClientLogosBar';
import { PowerSuiteSection } from '@/components/home/PowerSuiteSection';
import { FieldWorkSection } from '@/components/home/FieldWorkSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { DigitikaTeaser } from '@/components/home/DigitikaTeaser';
import { TrustSection } from '@/components/home/TrustSection';
import { CTASection } from '@/components/home/CTASection';
import { fetchShowcaseTenants } from '@/lib/tenants';
import { fetchPublicPricing } from '@/lib/subscriptions';
import { listPublishedProjects } from '@/lib/projects-server';

// Live customers, prices and projects: refreshed hourly rather than baked in at build time.
export const revalidate = 3600;

export default async function HomePage() {
  const [showcase, pricing, projects] = await Promise.all([
    fetchShowcaseTenants(),
    fetchPublicPricing(),
    listPublishedProjects(3),
  ]);

  return (
    <>
      <HeroSection liveBusinesses={showcase.total} />
      <ClientLogosBar tenants={showcase.tenants} />
      <PowerSuiteSection pricing={pricing} />
      <FieldWorkSection projects={projects} />
      <ServicesSection />
      <DigitikaTeaser />
      <TrustSection />
      <CTASection />
    </>
  );
}
