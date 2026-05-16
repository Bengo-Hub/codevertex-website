import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { SiteShell } from '@/components/layout/SiteShell';
import { ChatBot } from '@/components/chat/ChatBot';

const geistSans = Geist({
  variable: '--font-geist-sans',
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
    default: 'Codevertex IT Solutions',
    template: '%s | Codevertex IT Solutions',
  },
  description:
    "Architecting Africa's Digital Renaissance. Enterprise software, AI, cloud infrastructure, and Digitika Academy talent development from Kisumu, Kenya.",
  keywords: ['Codevertex', 'IT Solutions', 'Kenya', 'Africa', 'Software Development', 'AI', 'Cloud', 'Digitika'],
  authors: [{ name: 'Codevertex IT Solutions', url: 'https://codevertexitsolutions.com' }],
  metadataBase: new URL('https://codevertexitsolutions.com'),
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: 'https://codevertexitsolutions.com',
    siteName: 'Codevertex IT Solutions',
    title: "Codevertex IT Solutions — Architecting Africa's Digital Renaissance",
    description:
      'Premier technology firm in Kisumu, Kenya. Enterprise software, AI analytics, cloud infrastructure, and Digitika Academy.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codevertex IT Solutions',
    description: "Architecting Africa's Digital Renaissance.",
  },
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fef9ee' },
    { media: '(prefers-color-scheme: dark)', color: '#050d1f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-background antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SiteShell>{children}</SiteShell>
          <ChatBot />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
