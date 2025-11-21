'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api/client';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Plus } from 'lucide-react';
import UpdateTripModal from '@/components/trip/update-trip-modal';
import DeleteTripModal from '@/components/trip/delete-trip-modal';
import { useMemo, useRef } from 'react';
import {
  useParams,
  useSearchParams,
  useRouter,
} from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import type { Trip as StoreTrip } from '@/lib/redux/tripsSlice';
import TripMapOverview from '@/components/trip/trip-map-overview';

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

// Use the shared Trip type from the store to align with modals
type ApiTrip = {
  id: string | number;
  title?: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  coverImage?: string | null;
  visibility?: StoreTrip['visibility'];
};

// NOTE: Dynamic metadata can be added via a server component wrapper; since this is client, we cannot export generateMetadata here.
export default function TripLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [trip, setTrip] = useState<StoreTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationsCount, setLocationsCount] = useState<number | null>(
    null
  );
  const [entriesCount, setEntriesCount] = useState<number | null>(
    null
  );
  const [ownerProfile, setOwnerProfile] = useState<{
    id: string;
    name?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  } | null>(null);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const handledParamsRef = useRef<Set<string>>(new Set());
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
        const [locationsResponse, tripResponse, entriesResponse] =
          await Promise.all([
            api.get(`/locations?tripId=${tripId}`),
            api.get(`/trips/${tripId}`),
            // fetch a single entry page to obtain total count for the trip
            api.get(`/entries?tripId=${tripId}&page=1&limit=1`),
          ]);
        // console.log('Trip response:', tripResponse.data);
        setLocations(locationsResponse.data.items);
        setLocationsCount(locationsResponse.data.total ?? null);
        setEntriesCount(entriesResponse.data.total ?? null);
        // Normalize API trip to StoreTrip shape
        const t = tripResponse.data as ApiTrip;
        const normalized: StoreTrip = {
          id: String(t.id),
          title: t.title ?? '',
          description: t.description ?? null,
          startDate: t.startDate,
          endDate: t.endDate,
          coverImage: t.coverImage ?? null,
          visibility:
            (t.visibility as StoreTrip['visibility']) ?? 'PRIVATE',
        };
        setTrip(normalized);
        // Fetch current user's profile (owner) to display avatar/name in header
        try {
          const profileResp = await api.get('/users/profile');
          setOwnerProfile(profileResp.data ?? null);
        } catch {
          // ignore - profile may be unavailable if unauthenticated
          setOwnerProfile(null);
        }
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

  // Handle optimistic count updates signaled via query params
  useEffect(() => {
    if (!tripId) return;
    const sp = searchParams;
    if (!sp) return;
    let didChange = false;

    const locCreated = sp.get('locationCreated');
    const locId = sp.get('locationId');
    const locDeleted = sp.get('locationDeleted');
    const entryCreated = sp.get('entryCreated');
    const entryDeleted = sp.get('entryDeleted');
    const entryId = sp.get('entryId');

    if (locCreated === '1') {
      const key = `locationCreated:${locId ?? 'unknown'}`;
      if (!handledParamsRef.current.has(key)) {
        handledParamsRef.current.add(key);
        setLocationsCount((prev) =>
          prev === null ? locations.length + 1 : prev + 1
        );
        showToast('Location added', 'success');
        didChange = true;
      }
    }

    if (locDeleted === '1' && locId) {
      const key = `locationDeleted:${locId}`;
      if (!handledParamsRef.current.has(key)) {
        handledParamsRef.current.add(key);
        setLocationsCount((prev) =>
          prev === null
            ? Math.max(0, locations.length - 1)
            : Math.max(0, prev - 1)
        );
        setLocations((prev) => prev.filter((l) => l.id !== locId));
        showToast('Location deleted', 'success');
        didChange = true;
      }
    }

    if (entryCreated === '1') {
      const key = `entryCreated:${entryId ?? 'unknown'}`;
      if (!handledParamsRef.current.has(key)) {
        handledParamsRef.current.add(key);
        setEntriesCount((prev) => (prev === null ? null : prev + 1));
        showToast('Entry created', 'success');
        didChange = true;
      }
    }

    if (entryDeleted === '1') {
      const key = `entryDeleted:${entryId ?? 'unknown'}`;
      if (!handledParamsRef.current.has(key)) {
        handledParamsRef.current.add(key);
        setEntriesCount((prev) =>
          prev === null ? null : Math.max(0, prev - 1)
        );
        showToast('Entry deleted', 'success');
        didChange = true;
      }
    }

    if (didChange) {
      // clear params so we don't handle them again
      const url = new URL(window.location.href);
      url.searchParams.delete('locationCreated');
      url.searchParams.delete('locationId');
      url.searchParams.delete('locationDeleted');
      url.searchParams.delete('entryCreated');
      url.searchParams.delete('entryDeleted');
      url.searchParams.delete('entryId');
      router.replace(url.pathname + url.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tripId, locations.length]);

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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl p-4 sm:p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 md:mb-0">
              {trip ? trip.title : 'Trip Locations'}
            </h1>

            {/* Owner + counts row */}
            <div className="mt-3 flex items-center gap-4">
              {ownerProfile ? (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={
                        getAssetUrl(ownerProfile.avatarUrl) ||
                        '/uploads/avatars/default-avatar.png'
                      }
                      alt={
                        ownerProfile.name ||
                        ownerProfile.username ||
                        'Owner'
                      }
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">
                      {ownerProfile.name ||
                        ownerProfile.username ||
                        'You'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Trip owner
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="text-sm text-gray-600 flex items-center gap-4">
                <div>
                  <span className="font-semibold text-gray-800">
                    {locationsCount !== null
                      ? locationsCount
                      : locations.length}
                  </span>
                  <span className="ml-1"> locations</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-800">
                    {entriesCount !== null ? entriesCount : '—'}
                  </span>
                  <span className="ml-1"> entries</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {tripId && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="shrink-0 md:inline-flex"
              >
                <Link href={`/dashboard/trips-overview/`}>
                  <ArrowLeft className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">
                    Back to Overview
                  </span>
                </Link>
              </Button>
            )}
            {/* Btn */}
            <div className="ml-auto flex items-center gap-2">
              {trip && <UpdateTripModal trip={trip} />}
              {trip && <DeleteTripModal trip={trip} />}
              <Button asChild className="inline-flex">
                <Link
                  href={`/dashboard/trips-overview/${tripId}/add-location`}
                >
                  <Plus className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">
                    Add New Location
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Map Overview */}
        {!loading && !error && locations.length > 0 && tripId && (
          <div className="mb-8">
            <TripMapOverview
              tripId={tripId}
              locations={locations}
              className="h-[400px] md:h-[500px]"
            />
          </div>
        )}

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
              <Spinner label="Loading locations..." />
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
                <Link
                  key={location.id}
                  href={`/dashboard/trips-overview/${tripId}/location/${location.id}`}
                  className="group block"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition duration-200 group-hover:scale-[1.02] cursor-pointer">
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
                </Link>
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
