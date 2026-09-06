import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'PULSEware · Healthcare OS',
    template: '%s · PULSEware',
  },
  description: 'The Intelligent Operating System for Modern Medical Clinics & AI WhatsApp Booking.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
