export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-32"></div>
        <div className="h-6 bg-gray-200 dark:bg-dark-700 rounded w-20"></div>
      </div>
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded w-40"></div>
        <div className="h-5 bg-gray-200 dark:bg-dark-700 rounded w-36"></div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
        <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-48"></div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
