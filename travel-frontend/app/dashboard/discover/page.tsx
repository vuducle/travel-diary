'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import api from '@/lib/api/client';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';

interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

interface Trip {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  visibility: 'PUBLIC';
  user: User;
  _count?: { locations?: number; entries?: number };
}

interface PaginatedResponse {
  items: Trip[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export default function DiscoverPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const limit = 12;

  const fetchTrips = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        const response = await api.get(
          `/trips/all?page=${pageNum}&limit=${limit}`
        );
        const data: PaginatedResponse = response.data;

        if (append) {
          setTrips((prev) => [...prev, ...data.items]);
        } else {
          setTrips(data.items);
        }
        setHasMore(data.hasNextPage);
        setError(null);
      } catch (err) {
        setError('Failed to fetch public trips.');
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTrips(1);
  }, [fetchTrips]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !loading
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading]);

  useEffect(() => {
    if (page > 1) {
      fetchTrips(page, true);
    }
  }, [page, fetchTrips]);

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

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">
              Discover Public Trips
            </h1>
            <p className="text-gray-600 mt-2">
              Explore trips shared by travelers around the world
            </p>
          </div>
        </div>

        {/* Grid */}
        {loading && trips.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <Spinner label="Loading trips..." />
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-red-500">
            {error}
          </div>
        )}
        {!loading && !error && trips.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            No public trips found.
          </div>
        )}
        {trips.length > 0 && (
          <>
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {trips.map((trip) => {
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
                  <div key={trip.id} className="group">
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition duration-200 group-hover:scale-[1.02]">
                      <Image
                        src={cover}
                        alt={trip.title}
                        fill
                        className="object-cover"
                      />
                      {/* top-right public icon */}
                      <div className="absolute top-2 right-2 z-10">
                        <Globe className="h-4 w-4 text-white" />
                      </div>
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
                        <div className="text-white/70 text-xs mt-1">
                          {typeof trip._count?.locations ===
                          'number' ? (
                            <span>
                              {trip._count.locations} location
                              {trip._count.locations === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span>— locations</span>
                          )}{' '}
                          <span className="mx-2">•</span>
                          {typeof trip._count?.entries ===
                          'number' ? (
                            <span>
                              {trip._count.entries} entr
                              {trip._count.entries === 1
                                ? 'y'
                                : 'ies'}
                            </span>
                          ) : (
                            <span>— entries</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Author info */}
                    <div className="flex items-center gap-2 mt-3 px-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            getAssetUrl(trip.user.avatarUrl) ||
                            undefined
                          }
                          alt={trip.user.name}
                        />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(trip.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-700">
                        {trip.user.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} className="mt-8 text-center">
              {loadingMore && (
                <div className="py-4">
                  <Spinner label="Loading more trips..." />
                </div>
              )}
              {!hasMore && trips.length > 0 && (
                <p className="text-gray-500 text-sm py-4">
                  You&apos;ve reached the end
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
