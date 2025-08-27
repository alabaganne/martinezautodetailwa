'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-100/30 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}></div>
      {/* Sidebar Component */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <div className="lg:pl-64 relative">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white/80 backdrop-blur-md border-b-2 border-gray-200/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Admin</span>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full" />
          </div>
        </div>
        
        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
    </AdminAuthProvider>
  );
}