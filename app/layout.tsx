import './globals.css'
import { BookingProvider } from '@/contexts/BookingProvider'
import { CatalogProvider } from '@/contexts/CatalogContext'
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
        <CatalogProvider>
          <BookingProvider>
            {children}
          </BookingProvider>
        </CatalogProvider>
      </body>
    </html>
  )
}