'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  MapPin,
  Globe,
  Navigation,
  MapPinned,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import api from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { getAssetUrl } from '@/lib/utils/image-utils';
import { Spinner } from '@/components/ui/spinner';

// Dynamically import LocationMap to avoid SSR issues
const LocationMap = dynamic(
  () => import('@/components/core/location-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg border border-border flex items-center justify-center bg-muted">
        <Spinner label="Loading map..." />
      </div>
    ),
  }
);

interface Location {
  id: string;
  name: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  road?: string;
  county?: string;
  lat?: number;
  lng?: number;
  coverImage?: string;
  tripId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    children: number;
    entries: number;
  };
}

type EntrySummary = {
  id: string | number;
  title: string;
  date: string;
  images?: { id?: string; url: string }[];
};

export default function LocationDetailPage() {
  const params = useParams();
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const locationId = useMemo(() => {
    const raw = (
      params as Record<string, string | string[] | undefined>
    )?.locationId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const tripId = useMemo(() => {
    const raw = (
      params as Record<string, string | string[] | undefined>
    )?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const fetchLocation = useCallback(async () => {
    if (!locationId || !tripId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch trip data which includes basic location info
      const tripResponse = await api.get(`/trips/${tripId}`);
      const tripData = tripResponse.data;

      // Find the specific location from the trip's locations
      const foundLocation = tripData.locations?.find(
        (loc: Location) => loc.id === locationId
      );

      if (!foundLocation) {
        setError('Location not found in this trip');
        return;
      }

      // Try to fetch detailed location data (includes _count, parent, county)
      // This will only work if user has access to the location
      try {
        const detailedResponse = await api.get(
          `/locations/${locationId}`
        );
        setLocation(detailedResponse.data);
      } catch {
        // If detailed fetch fails, use basic location data from trip
        console.log('Using basic location data from trip');
        setLocation(foundLocation);
      }
    } catch (err) {
      console.error('Failed to fetch location:', err);
      const errorMessage =
        (err as { response?: { status?: number } })?.response
          ?.status === 404
          ? 'Trip not found or not accessible'
          : 'Failed to load location details';
      setError(errorMessage);
      showToastRef.current(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [locationId, tripId]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // fetch entries for this location
  const fetchEntries = useCallback(async () => {
    if (!location?.id) return;
    try {
      setEntriesLoading(true);
      const resp = await api.get('/entries/public', {
        params: { locationId: location.id, tripId },
      });
      const items = resp.data.items || resp.data || [];
      // Deduplicate by id to avoid duplicate tiles if fetch runs multiple times
      const map: Record<string, unknown> = {};
      for (const it of items) {
        map[String(it.id)] = it;
      }
      const unique = Object.values(map) as typeof items;
      setEntries(unique);
    } catch (e) {
      // ignore; entries are optional
      console.error('Failed to load entries', e);
    } finally {
      setEntriesLoading(false);
    }
  }, [location?.id, tripId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchEntries();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchEntries]);

  if (loading) {
    return <Spinner fullScreen label="Loading location..." />;
  }

  if (error || !location) {
    return (
      <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">
              {error || 'Location not found'}
            </p>
            {tripId && (
              <Button asChild className="mt-4 bg-red-400">
                <Link href={`/dashboard/trip/${tripId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Trip
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasValidCoordinates =
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    !Number.isNaN(location.lat) &&
    !Number.isNaN(location.lng);

  const coverImageUrl = location.coverImage
    ? getAssetUrl(location.coverImage) || location.coverImage
    : '/form/bg-chinatown.jpg';

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 rounded-3xl to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section with Cover Image */}
      <div className="relative h-[300px] sm:h-[400px] w-full">
        <Image
          src={coverImageUrl}
          alt={location.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
          {tripId && (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="backdrop-blur-md bg-primary/90 hover:bg-primary/80 shadow-lg"
            >
              <Link href={`/dashboard/trip/${tripId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
          )}
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-md">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                  {location.name}
                </h1>
                {location.country && (
                  <p className="text-sm sm:text-lg text-white/90 mt-1 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {location.country}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {location._count && (
            <>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">
                    {location._count.entries}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entries
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          {hasValidCoordinates && (
            <>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <Navigation className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-lg font-bold">
                    {location.lat?.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Latitude
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 text-center">
                  <MapPinned className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-lg font-bold">
                    {location.lng?.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Longitude
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Location Details Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {location.country && (
                <div className="p-4 rounded-lg bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                  <h3 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                    Country
                  </h3>
                  <p className="text-base font-medium">
                    {location.country}
                  </p>
                </div>
              )}
              {location.state && (
                <div className="p-4 rounded-lg bg-linear-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
                  <h3 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                    State/Province
                  </h3>
                  <p className="text-base font-medium">
                    {location.state}
                  </p>
                </div>
              )}
              {location.city && (
                <div className="p-4 rounded-lg bg-linear-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
                  <h3 className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide mb-1">
                    City
                  </h3>
                  <p className="text-base font-medium">
                    {location.city}
                  </p>
                </div>
              )}
              {location.street && (
                <div className="p-4 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                  <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                    Street
                  </h3>
                  <p className="text-base font-medium">
                    {location.street}
                  </p>
                </div>
              )}
              {location.road && (
                <div className="p-4 rounded-lg bg-linear-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900">
                  <h3 className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide mb-1">
                    Road
                  </h3>
                  <p className="text-base font-medium">
                    {location.road}
                  </p>
                </div>
              )}
              {location.county && (
                <div className="p-4 rounded-lg bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                  <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                    County
                  </h3>
                  <p className="text-base font-medium">
                    {location.county}
                  </p>
                </div>
              )}
              {location.parent && (
                <div className="p-4 rounded-lg bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                  <h3 className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                    Parent Location
                  </h3>
                  <p className="text-base font-medium">
                    {location.parent.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Entries Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Existing entries */}
              {entriesLoading ? (
                <div className="col-span-2 sm:col-span-3">
                  <Spinner label="Loading entries..." />
                </div>
              ) : entries.length > 0 ? (
                entries.map((en) => {
                  return (
                    <Link
                      key={en.id}
                      href={`/dashboard/trip/${tripId}/${location.id}/entry/${en.id}`}
                    >
                      <div className="rounded-2xl bg-white/60 border shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group">
                        {en.images && en.images.length > 0 ? (
                          <Image
                            src={
                              getAssetUrl(en.images[0].url) ||
                              en.images[0].url
                            }
                            alt={en.title}
                            width={800}
                            height={500}
                            unoptimized
                            className="object-cover w-full h-28 rounded-t-2xl"
                          />
                        ) : (
                          <div className="w-full h-28 bg-muted rounded-t-2xl flex items-center justify-center text-sm text-muted-foreground">
                            No image
                          </div>
                        )}
                        <div className="p-3">
                          <div
                            className="font-medium truncate"
                            title={en.title}
                          >
                            {en.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(en.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-2 sm:col-span-3 text-center py-8 text-muted-foreground">
                  No entries yet for this location
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map Section */}
        {hasValidCoordinates && (
          <Card className="shadow-lg overflow-hidden">
            <CardHeader className="bg-linear-to-r bg-primary text-white">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <MapPinned className="h-5 w-5" />
                Interactive Map
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 sm:p-6">
                <LocationMap
                  lat={location.lat!}
                  lng={location.lng!}
                  locationName={location.name}
                  country={location.country}
                  state={location.state}
                  city={location.city}
                  street={location.street}
                  road={location.road}
                  county={location.county}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
