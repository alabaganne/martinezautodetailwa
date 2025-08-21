import './globals.css'
import { BookingProvider } from '@/contexts/BookingProvider'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import FloatingDashboardButton from '@/components/FloatingDashboardButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Martinez Auto Detail - Car Wash Appointments',
  description: 'Book your professional car detailing appointment online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AdminAuthProvider>
          <BookingProvider>
            <FloatingDashboardButton />
            {children}
          </BookingProvider>
        </AdminAuthProvider>
      </body>
    </html>
  )
}