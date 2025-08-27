'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { 
  Home, 
  Clock,
  ArrowLeft,
  LogOut,
  X,
  LucideIcon
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAdminAuth();
  
  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Calendar', href: '/admin/calendar', icon: Clock },
  ];
  
  const isActive = (href: string): boolean => pathname === href;
  
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
        credentials: 'include'
      });
      // Redirect to home page instead of login page
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  
  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 transform transition-transform lg:translate-x-0 shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full p-6 space-y-3">
          <Link
            href="/"
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} className='mr-3' />
            Back to Booking Site
          </Link>
          {isAdmin && (
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white hover:bg-gray-700 transition-colors"
            >
              <LogOut size={20} className='mr-3' />
              Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;