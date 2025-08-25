import React from 'react';

const BookingHeader: React.FC = () => {
  return (
    <div className="text-center mb-8">
      <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">
        Martinez Auto Detail
      </h1>
      <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4" />
      <p className="text-gray-700 text-lg font-medium">Professional Car Detailing Services</p>
    </div>
  );
};

export default BookingHeader;