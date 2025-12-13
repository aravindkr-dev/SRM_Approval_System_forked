'use client';

import { useState, useEffect } from 'react';
import { formatIndianNumber, parseIndianNumber, getIndianNumberLabel } from '../lib/indian-number-format';

interface CostEstimateInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  className?: string;
}

export default function CostEstimateInput({ value, onChange, error, className = '' }: CostEstimateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Always show formatted version with commas
    setDisplayValue(value ? formatIndianNumber(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Parse the number and call onChange
    const numericValue = parseIndianNumber(inputValue);
    onChange(numericValue);
    
    // Always show formatted version with commas in the input
    if (numericValue > 0) {
      setDisplayValue(formatIndianNumber(numericValue));
    } else {
      setDisplayValue('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Allow only numbers, commas, and decimal points
    if (!/[0-9,.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Get current typed value for real-time feedback
  const currentTypedValue = parseIndianNumber(displayValue);

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">₹</span>
        </div>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          placeholder="0"
          className={`
            block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />
      </div>
      
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}