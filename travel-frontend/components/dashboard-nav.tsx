'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { clearToken } from '@/lib/redux/authSlice';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Plus,
  MessageCircle,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getAvatarUrl } from '@/lib/utils/image-utils';
import { cn } from '@/lib/utils';

export default function DashboardNav() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get user's display name
  const displayName = user?.name
    ? user.name
    : user?.username
    ? user.username
    : user?.email?.split('@')[0] || 'User';

  // Get full avatar URL from backend
  const avatarUrl = getAvatarUrl(user?.avatarUrl);

  // Get user's initials for avatar fallback
  const getInitials = () => {
    if (user?.name) {
      return `${user.name[0]}${
        user.name.split(' ')[1]?.[0] || ''
      }`.toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = () => {
    dispatch(clearToken());
    router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const navLinkClasses = (path: string) =>
    cn(
      'p-2.5 rounded-full bg-[#5B7971] hover:bg-[#4a635b] active:bg-primary transition-colors shadow-md relative',
      {
        'bg-primary hover:bg-primary': pathname === path,
      }
    );

  return (
    <nav className="sticky top-0 z-50 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white/30 backdrop-blur-lg rounded-b-2xl border border-t-0 border-white/50 shadow-lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="shrink-0">
            <Link
              href="/dashboard"
              className="text-xl font-semibold text-gray-800"
            >
              TravelDiary
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md md:mx-8 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white/90 backdrop-blur-sm text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E6B54E] focus:border-transparent"
                disabled
              />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-3">
            {/* Home Button */}
            <Link href="/dashboard">
              <button
                className={navLinkClasses('/dashboard')}
                aria-label="Home"
              >
                <Home className="h-5 w-5 text-white" />
              </button>
            </Link>

            {/* Create Button */}
            <button
              className="p-2.5 rounded-full bg-[#5B7971] hover:bg-[#4a635b] transition-colors shadow-md relative"
              aria-label="Create"
              disabled
            >
              <Plus className="h-5 w-5 text-white" />
            </button>

            {/* Messages Button */}
            <button
              className="p-2.5 rounded-full bg-[#5B7971] hover:bg-[#4a635b] transition-colors shadow-md relative"
              aria-label="Messages"
              disabled
            >
              <MessageCircle className="h-5 w-5 text-white" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-white border-2 border-[#5B7971]" />
            </button>

            {/* Notifications Button */}
            <button
              className="p-2.5 rounded-full bg-[#5B7971] hover:bg-[#4a635b] transition-colors shadow-md relative"
              aria-label="Notifications"
              disabled
            >
              <Bell className="h-5 w-5 text-white" />
              <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-white border-2 border-[#5B7971]" />
            </button>

            {/* Profile Button */}
            <Link href="/dashboard/profile">
              <button
                className={navLinkClasses('/dashboard/profile')}
                aria-label="Profile"
              >
                <UserIcon className="h-5 w-5 text-white" />
              </button>
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative ml-3" ref={dropdownRef}>
              <div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-800 focus:outline-none"
                >
                  <div className="relative">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="rounded-full border-2 h-10 w-10 border-white shadow-sm object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-600 border-2 border-white shadow-sm flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block">
                    {displayName}
                  </span>
                </button>
              </div>
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
