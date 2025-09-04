import React from 'react';
import { Phone, MapPin, Copyright } from 'lucide-react';

const BookingFooter: React.FC = () => {
  const contactInfo = [
    {
      icon: Phone,
      href: "tel:36°-545-3506",
      text: "(360) 545 3506",
    },
    {
      icon: MapPin,
      href: "#",
      text: "1728 Harisson Ave, Centralia WA 98531",
    }
  ];

  return (
    <div className="text-center mt-10 text-md">
      <div className="flex items-center justify-center space-x-6 mb-3">
        {contactInfo.map((info, idx) => {
          const Icon = info.icon;
          return (
            <a key={idx} href={info.href} className={`flex items-center text-gray-700 hover:text-brand-600 transition-colors group`}>
              <div className="p-2 bg-brand-600 rounded-lg mr-2">
                <Icon size={14} className="text-brand-50" />
              </div>
              <span className="font-medium">{info.text}</span>
            </a>
          );
        })}
      </div>
      <p className="text-gray-900 flex items-center justify-center gap-1.5"><Copyright size={15} /> 2024 Martinez Auto Detail. All rights reserved</p>
      <p className="text-gray-700 mt-1">
        Developed and maintained by{' '}
        <a
          href="https://strivehawk.us/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 font-semibold hover:underline"
        >
          Strivehawk
        </a>
      </p>
    </div>
  );
};

export default BookingFooter;
