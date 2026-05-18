import React from 'react';
import { Check } from 'lucide-react';

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto mb-12 px-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center border transition-all duration-500 ${isCompleted
                    ? 'bg-[#0F172A] border-[#0F172A] text-white'
                    : isActive
                      ? 'border-[#007AFF] text-[#007AFF] bg-white ring-4 ring-blue-50'
                      : 'border-[#E2E8F0] text-[#94A3B8] bg-white'
                  }`}
              >
                {isCompleted ? (
                  <Check size={18} />
                ) : (
                  <span className="text-[13px] font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={`mt-3 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors duration-300 ${isActive ? 'text-[#0F172A]' : 'text-[#94A3B8]'
                  }`}
              >
                {step.title}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 h-[1px] mx-2 -mt-7 bg-[#E2E8F0] relative">
                <div
                  className="absolute top-0 left-0 h-full bg-[#0F172A] transition-all duration-700 ease-in-out"
                  style={{ width: isCompleted ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
