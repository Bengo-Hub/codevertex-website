import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Poppins } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { SiteShell } from '@/components/layout/SiteShell';

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Codevertex Africa Limited',
    template: '%s | Codevertex Africa Limited',
  },
  description:
    "Architecting Africa's Digital Renaissance. Enterprise software, AI, cloud infrastructure, and Digitika Academy talent development from Kisumu, Kenya.",
  keywords: ['Codevertex', 'IT Solutions', 'Kenya', 'Africa', 'Software Development', 'AI', 'Cloud', 'Digitika'],
  authors: [{ name: 'Codevertex Africa Limited', url: 'https://codevertexitsolutions.com' }],
  metadataBase: new URL('https://codevertexitsolutions.com'),
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://codevertexitsolutions.com',
    siteName: 'Codevertex Africa Limited',
    title: "Codevertex Africa Limited — Architecting Africa's Digital Renaissance",
    description:
      'Premier technology firm in Kisumu, Kenya. Enterprise software, AI analytics, cloud infrastructure, and Digitika Academy.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codevertex Africa Limited',
    description: "Architecting Africa's Digital Renaissance.",
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/images/logo.png' }],
    shortcut: '/icon.svg',
    apple: '/images/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0910' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${geistMono.variable} font-sans min-h-screen bg-background antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SiteShell>{children}</SiteShell>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        {/* Vera AI widget — loaded as a plain async script so document.currentScript works */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://marketflow.codevertexitsolutions.com/widget/chat.js"
          data-tenant="codevertex"
          data-mode="platform"
          data-business-type="codevertex"
          data-api-url="https://marketflowai.codevertexitsolutions.com"
          data-primary-color="#9100B0"
          data-accent-color="#b800e0"
          data-widget-title="Vera"
          data-whatsapp="254743793901"
          data-phone="+254743793901"
        />
      </body>
    </html>
  );
}
