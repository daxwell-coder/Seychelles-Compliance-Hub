import React from 'react';
import { Button } from '@/components/ui/button';

const ProgressIndicator = ({ currentStep, totalSteps, stepTitles, onStepClick }) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full progress-paradise rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between gap-2">
        {stepTitles.map((title, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = isCompleted || isActive;
          
          return (
            <Button
              key={index}
              variant="ghost"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`
                flex-1 p-4 glass-effect rounded-xl text-center transition-all duration-300 border
                ${isCompleted 
                  ? 'bg-green-500/20 border-green-400/50 text-green-200' 
                  : isActive 
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200' 
                    : 'bg-white/5 border-white/20 text-white/60'
                }
                ${isClickable ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'}
              `}
            >
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mb-2 text-sm font-bold
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isActive 
                      ? 'bg-cyan-500 text-white' 
                      : 'bg-white/20 text-white/60'
                  }
                `}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="text-xs font-medium">{title}</div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;