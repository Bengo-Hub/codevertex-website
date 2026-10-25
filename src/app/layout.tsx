import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { SiteShell } from '@/components/layout/SiteShell';
import { CookieConsentBanner } from '@/components/layout/CookieConsentBanner';
import { VeraWidget } from '@/components/layout/VeraWidget';
import { JsonLd, organizationJsonLd } from '@/lib/json-ld';

const display = Bricolage_Grotesque({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
});

const body = Figtree({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const DESCRIPTION =
  'Codevertex Africa Limited builds the Power Suite, business software for shops, restaurants, hotels, schools, clinics and transport operators in Kenya, and trains developers at Digitika Academy in Kisumu.';

export const metadata: Metadata = {
  title: {
    default: 'Codevertex Africa Limited',
    template: '%s | Codevertex Africa Limited',
  },
  description: DESCRIPTION,
  authors: [{ name: 'Codevertex Africa Limited', url: 'https://codevertexafrica.com' }],
  metadataBase: new URL('https://codevertexafrica.com'),
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://codevertexafrica.com',
    siteName: 'Codevertex Africa Limited',
    title: "Codevertex Africa Limited: Architecting Africa's Digital Excellence",
    description: DESCRIPTION,
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'The Codevertex Africa Limited team' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codevertex Africa Limited',
    description: DESCRIPTION,
    images: ['/images/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1E0F1B' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd data={organizationJsonLd()} />
      </head>
      <body className={`${display.variable} ${body.variable} font-sans min-h-screen bg-background antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SiteShell>{children}</SiteShell>
          <Toaster richColors position="top-right" />
          <CookieConsentBanner />
        </ThemeProvider>
        <VeraWidget />
      </body>
    </html>
  );
}
