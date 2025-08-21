'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function FloatingDashboardButton() {
  const { isAdmin, isLoading } = useAdminAuth();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  
  // Don't show on admin pages or login page
  const isAdminPage = pathname?.startsWith('/admin');
  
  useEffect(() => {
    // Add a small delay for smooth appearance
    console.log('[FloatingButton] State:', { isAdmin, isAdminPage, isLoading });
    if (isAdmin && !isAdminPage && !isLoading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isAdmin, isAdminPage, isLoading]);
  
  // Don't render if not admin or on admin pages
  if (!isAdmin || isAdminPage || isLoading) {
    return null;
  }
  
  return (
    <Link
      href="/admin"
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-2 
        px-4 py-2.5 
        bg-gray-900/90 backdrop-blur-md
        text-white text-sm font-medium
        rounded-full shadow-lg
        border border-gray-700/50
        hover:bg-gray-800/95 hover:scale-105 hover:shadow-xl
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <LayoutDashboard size={18} />
      <span>Dashboard</span>
    </Link>
  );
}