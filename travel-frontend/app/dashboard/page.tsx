'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/lib/redux/store';
import { MapPin } from 'lucide-react';

export default function DashboardPage() {
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  // Dummy trips data - will be replaced with real data later
  const trips = [
    {
      id: 1,
      title: 'Vietnam 2024',
      username: 'Momo Trần',
      subtitle: 'Travel Enthusiast',
      date: '29.10.2024 - 14.10.2024',
      description:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book......",
      locations: 5,
      entries: 5,
      coverImage: null,
      userAvatar: null,
    },
    {
      id: 2,
      title: 'Vietnam 2024',
      username: 'Julia Nguyễn',
      subtitle: 'Travel Enthusiast',
      date: '29.10.2024 - 14.10.2024',
      description:
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
      locations: 5,
      entries: 5,
      coverImage: null,
      userAvatar: null,
    },
    {
      id: 3,
      title: 'Vietnam 2024',
      username: 'Julia Nguyễn',
      subtitle: 'Travel Enthusiast',
      date: '29.10.2024 - 14.10.2024',
      description:
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry...',
      locations: 5,
      entries: 5,
      coverImage: null,
      userAvatar: null,
    },
  ];

  return (
    <>
      {trips.map((trip) => (
        <div
          key={trip.id}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {trip.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {trip.username}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {trip.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{trip.locations} Locations</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>{trip.entries} Entries</span>
                </div>
              </div>
            </div>

            {/* Trip Cover Image */}
            <div className="relative h-48 bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden mb-4">
              {/* Placeholder for trip cover image */}
            </div>

            {/* Trip Details */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {trip.title}
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                {trip.date}
              </p>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {trip.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                </div>

                <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 py-2 rounded-full transition-colors">
                  View Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
