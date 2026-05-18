import type { Metadata } from 'next';
import { DigitikaHero } from '@/components/digitika/DigitikaHero';
import { AlumniBar } from '@/components/digitika/AlumniBar';
import { LifeAtDigitika } from '@/components/digitika/LifeAtDigitika';
import { TestimonialsSection } from '@/components/digitika/TestimonialsSection';
import { CourseCatalog } from '@/components/digitika/CourseCatalog';

export const metadata: Metadata = {
  title: 'Digitika Academy — Tech Education',
  description: 'Industry-aligned certification programmes in software engineering, AI, networking, data analytics, and ICDL. Enroll from Kisumu or online.',
  openGraph: {
    title: 'Digitika Academy | Codevertex IT Solutions',
    description: "Closing Africa's digital skills gap. Courses in coding, AI, networking, and data analytics.",
    url: 'https://codevertexitsolutions.com/digitika',
  },
};

export default function DigitikaPage() {
  return (
    <>
      <DigitikaHero />
      <AlumniBar />
      <LifeAtDigitika />
      <TestimonialsSection />
      <CourseCatalog />
    </>
  );
}
