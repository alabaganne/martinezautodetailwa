'use client'
import React from 'react';
import { Check, Sparkles, Calendar, User, Car, CheckCircle2, ListTodo, Phone } from 'lucide-react';

const ProgressBar = ({ currentStep, totalSteps = 5 }) => {
  const steps = [
    { number: 1, label: 'Service', icon: ListTodo },
    { number: 2, label: 'Schedule', icon: Calendar },
    { number: 3, label: 'Contact', icon: Phone },
    { number: 4, label: 'Vehicle', icon: Car },
    { number: 5, label: 'Confirm', icon: CheckCircle2 }
  ];

  return (
    <div className="mb-10 w-full px-4">
      <div className="relative">
        {/* Progress line container with gradient */}
        <div className="absolute top-6 left-0 right-0 flex items-center px-8">
          {steps.slice(0, -1).map((step, index) => (
            <div key={`line-${index}`} className="flex-1 px-2">
              <div className="relative h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ${
                    currentStep > step.number ? 'translate-x-0' : '-translate-x-full'
                  }`} 
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Steps container */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isPending = currentStep < step.number;
            
            return (
              <div key={step.number} className="flex flex-col items-center group">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 z-10 transform
                  ${isActive ? 'scale-110 ring-4 ring-blue-200 ring-offset-2' : ''}
                  ${isCompleted ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : ''}
                  ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl' : ''}
                  ${isPending ? 'bg-gray-200 text-gray-500 group-hover:bg-gray-300' : ''}
                `}>
                  {isCompleted ? (
                    <Check size={20} className="animate-fadeIn" />
                  ) : (
                    <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                  )}
                </div>
                <span className={`
                  text-xs mt-3 font-medium transition-colors duration-300
                  ${isActive ? 'text-blue-600 font-bold' : ''}
                  ${isCompleted ? 'text-gray-700' : 'text-gray-500'}
                `}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
