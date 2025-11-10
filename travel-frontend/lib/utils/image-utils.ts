/**
 * Get the full URL for an avatar image from the backend
 * @param avatarUrl - The avatar URL from the user object (e.g., "/uploads/avatars/filename.jpg")
 * @returns Full URL to the avatar image
 */
export function getAvatarUrl(
  avatarUrl: string | null | undefined
): string | null {
  if (!avatarUrl) return null;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3598';

  // If it's already a full URL, return as is
  if (
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://')
  ) {
    return avatarUrl;
  }

  // If it starts with /, it's a path from backend
  if (avatarUrl.startsWith('/')) {
    return `${API_URL}${avatarUrl}`;
  }

  // Otherwise, assume it's a relative path
  return `${API_URL}/${avatarUrl}`;
}

/**
 * Get the full URL for any uploaded asset from the backend
 * @param assetPath - The asset path (e.g., "/uploads/trips/filename.jpg")
 * @returns Full URL to the asset
 */
export function getAssetUrl(
  assetPath: string | null | undefined
): string | null {
  if (!assetPath) return null;

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3598';

  if (
    assetPath.startsWith('http://') ||
    assetPath.startsWith('https://')
  ) {
    return assetPath;
  }

  if (assetPath.startsWith('/')) {
    return `${API_URL}${assetPath}`;
  }

  return `${API_URL}/${assetPath}`;
}
