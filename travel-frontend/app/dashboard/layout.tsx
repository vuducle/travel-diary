'use client';

import AuthGuard from '@/components/auth-guard';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import Image from 'next/image';
import { getAvatarUrl, getAssetUrl } from '@/lib/utils/image-utils';
import { Briefcase, User } from 'lucide-react';
import DashboardNav from '@/components/dashboard-nav';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useSelector((state: RootState) => state.auth.user);
  const pathname = usePathname();
  const displayName = user?.name || user?.username || 'Anonymous';
  const avatarUrl = getAvatarUrl(user?.avatarUrl);

  // Dummy messages data - will be replaced with real data later
  const messages = [
    { id: 1, name: 'Vũ Minh Lê', avatar: null },
    { id: 2, name: 'Niklas Graß', avatar: null },
    { id: 3, name: 'Vũ Đức Lê', avatar: null },
    { id: 4, name: '박재영', avatar: null },
  ];

  return (
    <AuthGuard>
      <DashboardNav />
      <div className="p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Sidebar */}
          <aside className="space-y-6 sticky top-6 h-screen overflow-y-auto">
            {/* Profile Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <div className="relative h-32 -mx-6 -mt-6 mb-4 rounded-t-3xl overflow-hidden bg-linear-to-r from-orange-400 to-pink-400">
                {user?.coverImage && getAssetUrl(user.coverImage) ? (
                  <Image
                    src={getAssetUrl(user.coverImage)!}
                    alt="Cover image"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
                    <div className="bg-gray-300 rounded-lg"></div>
                    <div className="bg-gray-300 rounded-lg"></div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center -mt-16 relative">
                <div className="relative h-24 w-24 rounded-full border-4 border-white shadow-lg bg-white">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={displayName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  {displayName}
                </h2>
                <p className="text-sm text-gray-600">
                  @{user?.username || 'traveler'}
                </p>
                {user?.location && (
                  <p className="text-sm text-gray-500 mt-1">
                    {user.location}
                  </p>
                )}

                <div className="flex gap-3 mt-6 w-full">
                  <Link
                    href="/dashboard"
                    className={`flex-1 rounded-full p-3 flex items-center justify-center transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-primary text-white'
                        : 'bg-teal-500 hover:bg-teal-600 active:bg-primary text-white'
                    }`}
                  >
                    <span className="text-2xl">+</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className={`flex-1 rounded-full p-3 flex items-center justify-center transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-primary text-white'
                        : 'bg-teal-500 hover:bg-teal-600 active:bg-primary text-white'
                    }`}
                  >
                    <Briefcase className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className={`flex-1 rounded-full p-3 flex items-center justify-center transition-colors ${
                      pathname === '/dashboard/profile'
                        ? 'bg-primary text-white'
                        : 'bg-teal-500 hover:bg-teal-600 active:bg-primary text-white'
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 w-full text-center text-xs">
                  <span className="text-gray-600">Create Trip</span>
                  <span className="text-gray-600">Manage Trip</span>
                  <span className="text-gray-600">Profile</span>
                </div>
              </div>
            </div>

            {/* Messages Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Messages
              </h3>
              <div className="space-y-2">
                {messages.map((message) => (
                  <button
                    key={message.id}
                    className="w-full flex items-center gap-3 p-3 rounded-full bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {message.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {message.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="space-y-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
