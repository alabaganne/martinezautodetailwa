'use client'

import { useState, useEffect } from 'react'
import BookingSystem from '@/components/booking/BookingSystem'
import SquareApiTest from '@/components/SquareApiTest'

export default function Home() {
  const [showApiTest, setShowApiTest] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isDevMode = process.env.NODE_ENV === 'development'

  useEffect(() => {
    setMounted(true)
    // Check URL parameter on client side only
    if (window.location.search.includes('test=true')) {
      setShowApiTest(true)
    }
  }, [])

  // Show test page
  if (mounted && showApiTest) {
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
      {/* Dev mode: Show test button - only render after mount to avoid hydration issues */}
      {mounted && isDevMode && (
        <button 
          onClick={() => setShowApiTest(true)}
          className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border-2 border-transparent"
        >
          Test Square API
        </button>
      )}
      <BookingSystem />
    </div>
  )
}