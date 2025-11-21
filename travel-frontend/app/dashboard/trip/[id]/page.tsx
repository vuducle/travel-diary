'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api/client';
import TripMapOverview from '@/components/trip/trip-map-overview';
import CommentSection from '@/components/trip/comment-section';
import { Spinner } from '@/components/ui/spinner';
import Image from 'next/image';
import { getAssetUrl } from '@/lib/utils/image-utils';
import { Heart } from 'lucide-react';

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

interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

interface Trip {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  user?: User;
  locations?: Location[];
  _count?: {
    locations?: number;
    entries?: number;
    likes?: number;
    comments?: number;
  };
  userLiked?: boolean;
}

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);

  // Comment section state is managed inside the CommentSection component

  useEffect(() => {
    if (!tripId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const tripResponse = await api.get(`/trips/${tripId}`);
        setTrip(tripResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching trip data:', err);
        setError('Failed to load trip details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tripId]);

  const handleLikeToggle = async () => {
    if (!trip || isLiking) return;

    try {
      setIsLiking(true);

      if (trip.userLiked) {
        await api.delete(`/trips/${tripId}/like`);
      } else {
        await api.post(`/trips/${tripId}/like`);
      }

      // Optimistically update the UI
      setTrip((prev) =>
        prev
          ? {
              ...prev,
              userLiked: !prev.userLiked,
              _count: {
                ...prev._count,
                likes:
                  (prev._count?.likes ?? 0) +
                  (prev.userLiked ? -1 : 1),
              },
            }
          : null
      );
    } catch (err) {
      console.error('Error toggling like:', err);
      // Optionally show error to user
    } finally {
      setIsLiking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading trip..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl p-4 sm:p-6 md:p-10">
        <div className="mb-8">
          {/* Owner + counts */}
          <div className="mt-4 mb-4 flex justify-between gap-6">
            {trip?.user ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={
                      getAssetUrl(trip.user.avatarUrl) ||
                      '/uploads/avatars/default-avatar.png'
                    }
                    alt={
                      trip.user.name || trip.user.username || 'Owner'
                    }
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="text-sm text-gray-700">
                  <div className="font-medium">
                    {trip.user.name ||
                      trip.user.username ||
                      'Traveler'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {trip.user.bio || 'No bio available'}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="text-sm text-gray-600 flex items-center gap-4 flex-wrap">
              <div>
                <span className="font-semibold text-gray-800">
                  {trip?._count?.locations ??
                    trip?.locations?.length ??
                    0}
                </span>
                <span className="ml-1"> locations</span>
              </div>
              <div>
                <span className="font-semibold text-gray-800">
                  {trip?._count?.entries ?? 0}
                </span>
                <span className="ml-1"> entries</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity disabled:opacity-50"
                  aria-label={
                    trip?.userLiked ? 'Unlike trip' : 'Like trip'
                  }
                >
                  <Heart
                    className={`w-5 h-5 ${
                      trip?.userLiked
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-600'
                    }`}
                  />
                  <span className="font-semibold text-gray-800">
                    {trip?._count?.likes ?? 0}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">
            {trip?.title || 'Trip Details'}
          </h1>
          {trip?.description && (
            <p className="text-gray-600 mt-2">{trip.description}</p>
          )}
        </div>

        {/* Map Overview */}
        {trip?.locations && trip.locations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Location Overview
            </h2>
            <TripMapOverview
              locations={trip.locations}
              className="h-[400px] md:h-[500px]"
            />
          </div>
        )}

        {(!trip?.locations || trip.locations.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <p>No locations added to this trip yet.</p>
          </div>
        )}

        {/* Comments */}
        <div className="mt-8">
          <CommentSection
            tripId={tripId}
            onCommentCountChange={(count: number) =>
              setTrip((prev) =>
                prev
                  ? {
                      ...prev,
                      _count: {
                        ...(prev._count || {}),
                        comments: count,
                      },
                    }
                  : null
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
