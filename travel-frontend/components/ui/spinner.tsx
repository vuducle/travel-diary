'use client';

import React from 'react';
import clsx from 'clsx';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg' | number;
  fullScreen?: boolean;
  label?: string;
  className?: string;
};

function sizeToPx(size: SpinnerProps['size']) {
  if (typeof size === 'number') return size;
  switch (size) {
    case 'sm':
      return 20;
    case 'lg':
      return 48;
    case 'md':
    default:
      return 32;
  }
}

export function Spinner({
  size = 'md',
  fullScreen = false,
  label = 'Loading',
  className,
}: SpinnerProps) {
  const px = sizeToPx(size);
  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={clsx(
        'inline-flex items-center justify-center',
        className
      )}
    >
      <svg
        className="animate-spin text-primary"
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center backdrop-blur-sm bg-background/40">
        {spinner}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center py-8">
      {spinner}
    </div>
  );
}

export default Spinner;
