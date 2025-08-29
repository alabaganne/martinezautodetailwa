import React from 'react';
import { Phone, MapPin } from 'lucide-react';

const BookingFooter: React.FC = () => {
  return (
    <div className="text-center mt-10 text-sm">
      <div className="flex items-center justify-center space-x-6 mb-3">
        <a href="tel:555-123-4567" className="flex items-center text-gray-900 hover:text-brand-600 transition-colors group">
          <div className="p-2 bg-brand-100 rounded-lg mr-2 group-hover:bg-brand-200">
            <Phone size={14} className="text-brand-600" />
          </div>
          <span className="font-medium">(555) 123-4567</span>
        </a>
        <a href="#" className="flex items-center text-gray-600 hover:text-brand-600 transition-colors group">
          <div className="p-2 bg-brand-100 rounded-lg mr-2 group-hover:bg-brand-200">
            <MapPin size={14} className="text-brand-600" />
          </div>
          <span className="font-medium">123 Main St, City, ST 12345</span>
        </a>
      </div>
      <p className="text-gray-700">© 2024 Martinez Auto Detail. All rights reserved.</p>
    </div>
  );
};

export default BookingFooter;