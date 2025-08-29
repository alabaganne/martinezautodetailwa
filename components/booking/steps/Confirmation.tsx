'use client'
import React from 'react';
import { Check, CheckCircle } from 'lucide-react';
import { BookingFormData } from '@/contexts/BookingContext';

interface Props {
  formData: BookingFormData;
  setFormData: (data: BookingFormData) => void;
  setStep: (step: number) => void;
}

const Confirmation = ({ formData, setFormData, setStep }: Props) => {
  const handleNewBooking = () => {
    setStep(1);
    // Reset form will be handled by the parent component
  };

  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-50" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-600">We've sent a confirmation email to {formData.email || 'your email'}</p>
        {formData.startAt && (
          <p className="text-gray-700 mt-2 font-medium">
            Appointment Date: {new Date(formData.startAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
        <h3 className="font-semibold mb-3">What's Next?</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex">
            <span className="font-semibold mr-2">1.</span>
            <span>You'll receive a reminder text the day before your appointment</span>
          </li>
          <li className="flex">
            <span className="font-semibold mr-2">2.</span>
            <span>Drop off your vehicle at the scheduled time</span>
          </li>
          <li className="flex">
            <span className="font-semibold mr-2">3.</span>
            <span>We'll text you when your car is ready for pickup at 5:00 PM</span>
          </li>
        </ol>
      </div>

      <div className="space-y-3">
        {/* <button className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors">
          Add to Calendar
        </button> */}
        <button 
          onClick={handleNewBooking}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Book Another Appointment
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>Questions? Call us at <a href="tel:555-123-4567" className="text-brand-600 font-medium">(555) 123-4567</a></p>
      </div>
    </div>
  );
};

export default Confirmation;
