'use client';

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Next.js
const icon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to update map center when position changes
function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 13);
  }, [position, map]);

  return null;
}

interface LocationMapProps {
  lat: number;
  lng: number;
  locationName?: string;
  street?: string;
  county?: string;
  country?: string;
}

export default function LocationMap({
  lat,
  lng,
  locationName,
  street,
  county,
  country,
}: LocationMapProps) {
  const position: [number, number] = [lat, lng];

  return (
    <div className="h-[300px] sm:h-[400px] w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={icon}>
          <Popup maxWidth={250} className="custom-popup">
            <div className="space-y-1 p-1">
              {locationName && (
                <div className="font-semibold text-sm sm:text-base wrap-break-word">
                  {locationName}
                </div>
              )}
              {street && (
                <div className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    Street:{' '}
                  </span>
                  <span className="wrap-break-word">{street}</span>
                </div>
              )}
              {county && (
                <div className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    County:{' '}
                  </span>
                  <span className="wrap-break-word">{county}</span>
                </div>
              )}
              {country && (
                <div className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">
                    Country:{' '}
                  </span>
                  <span className="wrap-break-word">{country}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>
        <MapUpdater position={position} />
      </MapContainer>
    </div>
  );
}
