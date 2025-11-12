'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api/client';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';

interface Location {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  coverImage?: string;
  tripId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
}

// NOTE: Dynamic metadata can be added via a server component wrapper; since this is client, we cannot export generateMetadata here.
export default function TripLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const tripId = useMemo(() => {
    const raw = (
      params as Record<string, string | string[] | undefined>
    )?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  useEffect(() => {
    if (!tripId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [locationsResponse, tripResponse] = await Promise.all([
          api.get(`/locations?tripId=${tripId}`),
          api.get(`/trips/${tripId}`),
        ]);
        // console.log('Trip response:', tripResponse.data);
        setLocations(locationsResponse.data.items);
        setTrip(tripResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch trip data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const formatDate = (dateIso: string) => {
    const date = new Date(dateIso);
    try {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold">
            {trip ? trip.title : 'Trip Locations'}
          </h1>
          <div className="flex flex-between">
            {tripId && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="shrink-0  mr-2 md:inline-flex"
              >
                <Link href={`/dashboard/trips-overview/`}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to
                  Overview
                </Link>
              </Button>
            )}
            <Button asChild className="hidden md:inline-flex">
              <Link
                href={`/dashboard/trips-overview/${tripId}/add-location`}
              >
                Add New Location
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/dashboard/trips-overview/${tripId}/add-location`}
            className="group"
          >
            <div className="relative aspect-video rounded-2xl bg-primary shadow-[0_10px_25px_rgba(0,0,0,0.15)] ring-1 ring-black/5 flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.02]">
              <div className="flex flex-col items-center gap-3 text-gray-900">
                <div className="h-10 w-10 rounded-full bg-pink-500 text-white grid place-items-center shadow">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">
                  Add Location
                </span>
              </div>
            </div>
          </Link>

          {loading && (
            <div className="col-span-full text-center py-8 text-gray-600">
              Loading locations…
            </div>
          )}
          {error && (
            <div className="col-span-full text-center py-8 text-red-500">
              {error}
            </div>
          )}
          {!loading &&
            !error &&
            locations.map((location) => {
              const cover =
                getAssetUrl(location.coverImage) ||
                '/form/bg-chinatown.jpg';
              return (
                <div key={location.id} className="group">
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition duration-200 group-hover:scale-[1.02]">
                    <Image
                      src={cover}
                      alt={location.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                      <div className="text-white/90 text-sm sm:text-base font-medium truncate">
                        {location.name}
                      </div>
                      <div className="text-white/80 text-xs sm:text-[13px]">
                        {location.country} -{' '}
                        {formatDate(location.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {!loading && !error && locations.length === 0 && (
          <div className="mt-10 text-center text-gray-600">
            You haven&apos;t added any locations to this trip yet.
            <div className="mt-4">
              <Button asChild>
                <Link
                  href={`/dashboard/trips-overview/${tripId}/add-location`}
                >
                  Add your first location
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
