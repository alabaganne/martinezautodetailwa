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
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.number} className="flex-1">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                currentStep >= step.number ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? <CheckCircle size={20} /> : step.number}
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 transition-all ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 px-5">
        {steps.map(step => (
          <span key={step.number} className="text-xs text-gray-600">{step.label}</span>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;