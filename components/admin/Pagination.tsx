import React from 'react';

interface PaginationProps {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  currentCount: number;
  label?: string;
}

export default function Pagination({
  hasMore,
  loadingMore,
  onLoadMore,
  currentCount,
  label = 'appointments'
}: PaginationProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-center">
      <button
        onClick={onLoadMore}
        disabled={loadingMore}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loadingMore ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          `Load More ${label.charAt(0).toUpperCase() + label.slice(1)}`
        )}
      </button>
    </div>
  );
}
