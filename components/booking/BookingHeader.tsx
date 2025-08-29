import React from 'react';

const BookingHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-black bg-gradient-to-r from-brand-600 via-brand-600 to-brand-700 bg-clip-text text-transparent mb-3">
        Martinez Auto Detail
      </h1>
      <div className="h-1 w-32 mx-auto bg-gradient-to-r from-brand-500 to-brand-600 rounded-full mb-4" />
      <p className="text-black text-lg font-medium">Professional Car Detailing Services</p>
    </div>
  );
};

export default BookingHeader;