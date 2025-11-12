import { Karla, Merriweather, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import Footer from '@/components/core/footer';
import Providers from './providers';
import 'react-toastify/dist/ReactToastify.css';

// Body copy
const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  weight: ['300', '400', '500', '600', '700'],
});

// Headings
const merriweather = Merriweather({
  subsets: ['latin'],
  variable: '--font-merriweather',
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
});

// Optional monospace for code blocks
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${karla.variable} ${merriweather.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: {
    default: 'TravelDiary – Capture Your Journeys',
    template: '%s | TravelDiary',
  },
  description:
    'TravelDiary helps you capture trips, locations, and journal entries—preserve and share your travel memories.',
  applicationName: 'TravelDiary',
  keywords: [
    'travel diary',
    'trip journal',
    'travel log',
    'locations',
    'entries',
    'photos',
  ],
  authors: [{ name: 'TravelDiary Team' }],
  creator: 'TravelDiary',
  metadataBase: new URL('https://www.example.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.example.com',
    siteName: 'TravelDiary',
    title: 'TravelDiary – Capture Your Journeys',
    description:
      'Plan, record, and relive your adventures with trips, locations, and rich journal entries.',
    images: [
      {
        url: 'https://www.example.com/og/cover.jpg',
        width: 1200,
        height: 630,
        alt: 'TravelDiary cover image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@traveldiary',
    creator: '@traveldiary',
    title: 'TravelDiary – Capture Your Journeys',
    description:
      'Plan, record, and relive your adventures with trips, locations, and rich journal entries.',
    images: ['https://www.example.com/og/cover.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};
