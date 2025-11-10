'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import Image from 'next/image';
import { getAvatarUrl } from '@/lib/utils/image-utils';
import UpdateProfileModal from '@/components/update-profile-modal';
import DashboardNav from '@/components/dashboard-nav';

export default function ProfilePage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const displayName = user?.name || user?.username || 'Anonymous';
  const avatarUrl = getAvatarUrl(user?.avatarUrl);

  return (
    <>
      <DashboardNav />
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative h-48 bg-gray-300">
              {user?.coverImage && (
                <Image
                  src={getAvatarUrl(user.coverImage)}
                  alt="Cover image"
                  layout="fill"
                  objectFit="cover"
                />
              )}
              <div className="absolute top-4 right-4">
                <UpdateProfileModal />
              </div>
              <div className="absolute bottom-0 left-0 p-4">
                <div className="relative h-24 w-24 rounded-full border-4 border-white">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gray-400 flex items-center justify-center text-white text-3xl font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 pt-20">
              <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
              {user?.username && (
                <p className="text-md text-gray-500">@{user.username}</p>
              )}
              <p className="mt-4 text-gray-600">{user?.bio || 'No bio yet.'}</p>
              {user?.location && (
                <div className="mt-4 flex items-center text-gray-500">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{user.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
