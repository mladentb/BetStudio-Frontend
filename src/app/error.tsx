'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Nešto je pošlo po zlu!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error.message || 'Došlo je do greške prilikom učitavanja stranice.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Pokušaj ponovo
        </button>
      </div>
    </div>
  );
}
