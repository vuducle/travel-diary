'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/lib/redux/store';
import {
  MapPin,
  FileText,
  Heart,
  MessageCircle,
  Share2,
} from 'lucide-react';
import api from '@/lib/api/client';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';
import { Spinner } from '@/components/ui/spinner';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import Link from 'next/link';

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

export default function DashboardPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const limit = 3;

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

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
        setError('Failed to fetch trips.');
        console.error(err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token) {
      fetchTrips(1);
    }
  }, [token, fetchTrips]);

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
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })} - ${end.toLocaleDateString(undefined, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`;
      }
      return `${start.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })} - ${end.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`;
    } catch {
      return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {loading && trips.length === 0 && (
        <div className="text-center py-12">
          <Spinner label="Loading trips..." />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {!loading && !error && trips.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <p>No public trips to show yet.</p>
          <p className="text-sm mt-2">
            Check back later for travel inspiration!
          </p>
        </div>
      )}

      {trips.map((trip) => {
        const cover = getAssetUrl(trip.coverImage);
        const dateText = formatRange(trip.startDate, trip.endDate);

        return (
          <div
            key={trip.id}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        getAssetUrl(trip.user.avatarUrl) || undefined
                      }
                      alt={trip.user.name}
                    />
                    <AvatarFallback className="bg-linear-to-br from-blue-400 to-purple-500 text-white font-semibold">
                      {getUserInitials(trip.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {trip.user.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      @{trip.user.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {trip._count?.locations || 0} Locations
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{trip._count?.entries || 0} Entries</span>
                  </div>
                </div>
              </div>

              {/* Trip Cover Image */}
              {cover ? (
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                  <Image
                    src={cover}
                    alt={trip.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative h-48 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden mb-4" />
              )}

              {/* Trip Details */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {trip.title}
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  {dateText}
                </p>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                  {trip.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                      <Heart className="h-5 w-5" />
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                      <MessageCircle className="h-5 w-5" />
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>

                  <Link
                    href={`/dashboard/trips-overview/${trip.id}`}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2 rounded-full transition-colors"
                  >
                    View Trip
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="text-center py-4">
        {loadingMore && <Spinner label="Loading more trips..." />}
        {!hasMore && trips.length > 0 && (
          <p className="text-gray-500 text-sm">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}
