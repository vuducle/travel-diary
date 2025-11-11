'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api/client';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Let's define a Trip type based on what we know
interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
}

export default function TripsOverviewPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const response = await api.get('/trips');
        setTrips(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch trips.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const formatRange = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    try {
      const sameYear = start.getFullYear() === end.getFullYear();
      if (sameYear) {
        return `${start.toLocaleDateString(undefined, {
          month: 'short',
        })} – ${end.toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
        })}`;
      }
      return `${start.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })} – ${end.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })}`;
    } catch {
      return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
    }
  };

  const getYearLabel = (startIso: string, endIso: string) => {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    if (!isFinite(startYear) || !isFinite(endYear)) return '';
    return startYear === endYear
      ? `${startYear}`
      : `${startYear}–${endYear}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold">
            Trips overview
          </h1>
          <Button asChild className="hidden md:inline-flex">
            <Link href="/dashboard/create-trip">Create New Trip</Link>
          </Button>
        </div>

        {/* Grid with Add Trip tile */}
        <div className="grid gap-6 sm:gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {/* Add Trip tile */}
          <Link href="/dashboard/create-trip" className="group">
            <div className="relative aspect-square rounded-2xl bg-amber-400 shadow-[0_10px_25px_rgba(0,0,0,0.15)] ring-1 ring-black/5 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]">
              <div className="flex flex-col items-center gap-3 text-gray-900">
                <div className="h-10 w-10 rounded-full bg-pink-500 text-white grid place-items-center shadow">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Add Trip</span>
              </div>
            </div>
          </Link>

          {/* Trip cards */}
          {loading && (
            <div className="col-span-full text-center py-8 text-gray-600">
              Loading trips…
            </div>
          )}
          {error && (
            <div className="col-span-full text-center py-8 text-red-500">
              {error}
            </div>
          )}
          {!loading &&
            !error &&
            trips.map((trip) => {
              const cover =
                getAssetUrl(trip.coverImage) ||
                '/form/bg-chinatown.jpg';
              const dateText = formatRange(
                trip.startDate,
                trip.endDate
              );
              const yearLabel = getYearLabel(
                trip.startDate,
                trip.endDate
              );
              const displayTitle = yearLabel
                ? `${trip.title} ${yearLabel}`
                : trip.title;
              return (
                <Link
                  key={trip.id}
                  href={`/dashboard/trips-overview/${trip.id}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition duration-200 group-hover:scale-[1.02]">
                    <Image
                      src={cover}
                      alt={trip.title}
                      fill
                      className="object-cover"
                    />
                    {/* bottom gradient overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                    {/* text overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                      <div className="text-white/90 text-sm sm:text-base font-medium truncate">
                        {displayTitle}
                      </div>
                      <div className="text-white/80 text-xs sm:text-[13px]">
                        {dateText}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>

        {/* Empty state when no trips at all */}
        {!loading && !error && trips.length === 0 && (
          <div className="mt-10 text-center text-gray-600">
            You haven&apos;t created any trips yet.
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/create-trip">
                  Create your first trip
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
