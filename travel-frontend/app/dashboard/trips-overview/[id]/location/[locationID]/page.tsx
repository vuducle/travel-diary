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
import { ArrowLeft, MapPin } from 'lucide-react';
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
              <Button asChild className="mt-4">
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

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <MapPin className="h-6 w-6 text-primary mt-1" />
            <div>
              <CardTitle className="text-xl sm:text-2xl">
                {location.name}
              </CardTitle>
              {location.country && (
                <p className="text-sm text-muted-foreground mt-1">
                  {location.country}
                </p>
              )}
            </div>
          </div>
          {tripId && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 w-full sm:w-auto"
            >
              <Link href={`/dashboard/trips-overview/${tripId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Trip
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {location.street && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Street
                </h3>
                <p className="text-base mt-1">{location.street}</p>
              </div>
            )}
            {location.county && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  County
                </h3>
                <p className="text-base mt-1">{location.county}</p>
              </div>
            )}
            {location.country && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Country
                </h3>
                <p className="text-base mt-1">{location.country}</p>
              </div>
            )}
            {hasValidCoordinates && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Latitude
                  </h3>
                  <p className="text-base mt-1">{location.lat}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Longitude
                  </h3>
                  <p className="text-base mt-1">{location.lng}</p>
                </div>
              </>
            )}
            {location.parent && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Parent Location
                </h3>
                <p className="text-base mt-1">
                  {location.parent.name}
                </p>
              </div>
            )}
            {location._count && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Sub-locations
                  </h3>
                  <p className="text-base mt-1">
                    {location._count.children}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Entries
                  </h3>
                  <p className="text-base mt-1">
                    {location._count.entries}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Map Display */}
          {hasValidCoordinates && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Location on Map
              </h3>
              <LocationMap
                lat={location.lat!}
                lng={location.lng!}
                locationName={location.name}
                street={location.street}
                county={location.county}
                country={location.country}
              />
            </div>
          )}

          {/* Cover Image */}
          {location.coverImage && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Cover Image
              </h3>
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border">
                <Image
                  src={
                    getAssetUrl(location.coverImage) ||
                    location.coverImage
                  }
                  alt={location.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
