'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Calendar, 
  Home, 
  Users, 
  Settings, 
  Menu, 
  X,
  BarChart,
  Clock,
  ArrowLeft,
  LogOut
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { name: 'Calendar', href: '/admin/calendar', icon: Clock },
  ];
  
  const isActive = (href) => pathname === href;
  
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'DELETE',
        credentials: 'include'
      });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
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
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white hover:bg-gray-700 transition-colors"
          >
            <LogOut size={20} className='mr-3' />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Admin</span>
            <div className="w-8 h-8 bg-gray-300 rounded-full" />
          </div>
        </div>
        
        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}