'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/spinner';
import { useEffect } from 'react';

// Dynamically import map components to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center bg-gray-100 rounded-2xl h-[400px]">
        <Spinner label="Loading map..." />
      </div>
    ),
  }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface Location {
  id: string;
  name: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  lat: number;
  lng: number;
  coverImage?: string;
}

interface TripMapOverviewProps {
  locations: Location[];
  className?: string;
}

export default function TripMapOverview({
  locations,
  className = '',
}: TripMapOverviewProps) {
  // Fix Leaflet default marker icon paths
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Only render map on client side
  if (typeof window === 'undefined') {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-2xl ${className}`}
      >
        <Spinner label="Loading map..." />
      </div>
    );
  }

  // Filter locations with valid coordinates
  const validLocations = locations.filter(
    (loc) =>
      loc.lat !== null &&
      loc.lng !== null &&
      !isNaN(loc.lat) &&
      !isNaN(loc.lng)
  );

  if (validLocations.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-2xl p-12 ${className}`}
      >
        <div className="text-center text-gray-500">
          <svg
            className="h-16 w-16 mx-auto mb-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-lg font-medium">
            No locations to display
          </p>
          <p className="text-sm mt-1">
            Add locations with coordinates to see them on the map
          </p>
        </div>
      </div>
    );
  }

  // Calculate map center and bounds
  const bounds: [number, number][] = validLocations.map((loc) => [
    loc.lat,
    loc.lng,
  ]);

  const center: [number, number] =
    validLocations.length === 1
      ? [validLocations[0].lat, validLocations[0].lng]
      : [
          bounds.reduce((sum, coord) => sum + coord[0], 0) /
            bounds.length,
          bounds.reduce((sum, coord) => sum + coord[1], 0) /
            bounds.length,
        ];

  const zoom = validLocations.length === 1 ? 13 : 6;

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-lg ${className}`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-base mb-1">
                  {location.name}
                </h3>
                {location.street && (
                  <p className="text-gray-600">{location.street}</p>
                )}
                {location.city && (
                  <p className="text-gray-600">{location.city}</p>
                )}
                {location.state && (
                  <p className="text-gray-600">{location.state}</p>
                )}
                {location.country && (
                  <p className="text-gray-600 font-medium">
                    {location.country}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
