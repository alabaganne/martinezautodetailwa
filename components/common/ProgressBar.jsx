'use client'
import React from 'react';
import { CheckCircle } from 'lucide-react';

const ProgressBar = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Service' },
    { number: 2, label: 'Schedule' },
    { number: 3, label: 'Vehicle' },
    { number: 4, label: 'Confirm' }
  ];

  return (
    <div className="mb-8 w-full">
      <div className="relative">
        {/* Progress line container */}
        <div className="absolute top-5 left-0 right-0 flex items-center px-5">
          {steps.slice(0, -1).map((step, index) => (
            <div key={`line-${index}`} className="flex-1">
              <div className={`h-1 transition-all ${
                currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            </div>
          ))}
        </div>
        
        {/* Steps container */}
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all z-10 ${
                currentStep >= step.number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {currentStep > step.number ? <CheckCircle size={20} /> : step.number}
              </div>
              <span className="text-xs text-gray-600 mt-2">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
