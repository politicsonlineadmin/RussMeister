import type { Metadata, Viewport } from 'next';
import { Raleway, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RussMeister \u2014 Learn Russian from A1 to C2',
  description:
    'Master Russian with AI-powered personalized lessons. Adaptive curriculum from beginner to mastery, covering speaking, listening, reading, and writing.',
  applicationName: 'RussMeister',
  keywords: ['Russian', 'language learning', 'CEFR', 'A1', 'C2', 'Russian'],
  openGraph: {
    title: 'RussMeister \u2014 Learn Russian from A1 to C2',
    description:
      'Master Russian with AI-powered personalized lessons. Adaptive curriculum from beginner to mastery, covering speaking, listening, reading, and writing.',
    siteName: 'RussMeister',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RussMeister \u2014 Learn Russian from A1 to C2',
    description:
      'Master Russian with AI-powered personalized lessons. Adaptive curriculum from beginner to mastery, covering speaking, listening, reading, and writing.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8ffff',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${raleway.variable} ${jetbrainsMono.variable}`}>
      <body className={`${raleway.className} bg-[#f8ffff]`}>
        {children}
      </body>
    </html>
  );
}
