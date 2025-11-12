import Hero from '@/components/landingpage/hero';
import Features from '@/components/landingpage/features';
import AppShowcase from '@/components/landingpage/app-showcase';
import QuoteBanner from '@/components/landingpage/quote-banner';
import PublicGuard from '@/components/core/public-guard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'TravelDiary – Capture trips, locations, photos and journal entries in one beautiful place.',
};

function HomePage() {
  return (
    <PublicGuard>
      <Hero />
      <Features />
      <AppShowcase />
      <QuoteBanner />
    </PublicGuard>
  );
}

export default HomePage;
