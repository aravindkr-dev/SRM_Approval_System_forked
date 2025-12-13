'use client';

import { formatIndianNumber, getIndianNumberLabel } from '../lib/indian-number-format';

interface FormattedAmountProps {
  amount: number;
  showLabel?: boolean;
  className?: string;
}

export default function FormattedAmount({ amount, showLabel = false, className = '' }: FormattedAmountProps) {
  if (!amount || amount === 0) {
    return <span className={className}>₹0</span>;
  }

  return (
    <span className={className}>
      ₹{formatIndianNumber(amount)}
      {showLabel && (
        <span className="text-sm text-gray-500 ml-2">
          ({getIndianNumberLabel(amount).replace('₹', '')})
        </span>
      )}
    </span>
  );
}