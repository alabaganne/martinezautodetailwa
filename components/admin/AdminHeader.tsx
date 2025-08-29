'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showDate?: boolean;
}

export default function AdminHeader({
  title = 'Admin Dashboard',
  subtitle = 'Manage your car wash appointments',
  onRefresh,
  isRefreshing = false,
  showDate = true
}: AdminHeaderProps) {
  return (
    <div className="relative mb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700">
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
            <p className="text-brand-100 text-lg">{subtitle}</p>
            {showDate && (
              <div className="mt-4 text-sm text-brand-200">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border border-white/20"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>
      {/* Decorative pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
    </div>
  );
}