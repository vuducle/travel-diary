'use client';

import CreateTripForm from '@/components/create-trip-form';

export default function CreateTripPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
          Plan Your Next Adventure
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Fill out the details below to create your trip. Let's make some
          memories!
        </p>
      </div>
      <CreateTripForm />
    </div>
  );
}