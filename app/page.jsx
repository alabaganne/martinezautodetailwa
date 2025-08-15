'use client'

import { useState } from 'react'
import BookingSystem from '@/components/booking/BookingSystem'
import SquareApiTest from '@/components/SquareApiTest'
import { isDevelopment } from '@/lib/config/square'

export default function Home() {
  const [showApiTest, setShowApiTest] = useState(false)
  const isDevMode = isDevelopment()

  // Show test page with URL parameter or button
  if (typeof window !== 'undefined' && (window.location.search.includes('test=true') || showApiTest)) {
    return (
      <div>
        <button 
          onClick={() => setShowApiTest(false)}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          Back to Booking
        </button>
        <SquareApiTest />
      </div>
    )
  }

  return (
    <div>
      {/* Dev mode: Show test button */}
      {isDevMode && (
        <button 
          onClick={() => setShowApiTest(true)}
          className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg"
        >
          Test Square API
        </button>
      )}
      <BookingSystem />
    </div>
  )
}