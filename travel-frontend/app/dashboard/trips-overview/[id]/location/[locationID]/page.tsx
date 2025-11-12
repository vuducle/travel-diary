'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Folders,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import api from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { getAssetUrl } from '@/lib/utils/image-utils';

// Dynamically import LocationMap to avoid SSR issues
const LocationMap = dynamic(
  () => import('@/components/location-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg border border-border flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

interface Location {
  id: string;
  name: string;
  country?: string;
  street?: string;
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
    )?.locationID;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const tripId = useMemo(() => {
    const raw = (
      params as Record<string, string | string[] | undefined>
    )?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) return;

    const fetchLocation = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/locations/${locationId}`);
        setLocation(response.data);
      } catch (err) {
        console.error('Failed to fetch location:', err);
        setError('Failed to load location details');
        showToastRef.current(
          'Failed to load location details',
          'error'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [locationId]);

  if (loading) {
    return (
      <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Loading location details...
            </p>
          </CardContent>
        </Card>
      </div>
    );
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
                <Link href={`/dashboard/trips-overview/${tripId}`}>
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
              <Link href={`/dashboard/trips-overview/${tripId}`}>
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
                  <Folders className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">
                    {location._count.children}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sub-locations
                  </p>
                </CardContent>
              </Card>
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

        {/* Map Section */}
        {hasValidCoordinates && (
          <Card className="shadow-lg overflow-hidden">
            <CardHeader className="bg-linear-to-r from-blue-500 to-blue-600 text-white">
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
                  street={location.street}
                  county={location.county}
                  country={location.country}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
