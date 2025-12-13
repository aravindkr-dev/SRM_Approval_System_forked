/**
 * Indian Number System Formatter
 * Converts numbers to Indian format with lakhs and crores
 */

export function formatIndianNumber(num: number): string {
  if (num === 0) return '0';
  
  const numStr = Math.abs(num).toString();
  const isNegative = num < 0;
  
  // Handle decimals
  const [integerPart, decimalPart] = numStr.split('.');
  
  if (integerPart.length <= 3) {
    // Less than 1000, no formatting needed
    return (isNegative ? '-' : '') + numStr;
  }
  
  let formatted = '';
  const len = integerPart.length;
  
  // Add crores (10,00,00,000)
  if (len > 7) {
    const crores = integerPart.slice(0, len - 7);
    formatted += crores + ',';
    const remaining = integerPart.slice(len - 7);
    
    // Add lakhs from remaining
    if (remaining.length >= 5) {
      formatted += remaining.slice(0, 2) + ',';
      formatted += remaining.slice(2, 4) + ',';
      formatted += remaining.slice(4);
    } else {
      formatted += remaining;
    }
  }
  // Add lakhs (10,00,000)
  else if (len > 5) {
    const lakhs = integerPart.slice(0, len - 5);
    formatted += lakhs + ',';
    const remaining = integerPart.slice(len - 5);
    formatted += remaining.slice(0, 2) + ',';
    formatted += remaining.slice(2);
  }
  // Add thousands (10,000)
  else if (len > 3) {
    const thousands = integerPart.slice(0, len - 3);
    formatted += thousands + ',';
    formatted += integerPart.slice(len - 3);
  }
  
  // Add decimal part if exists
  if (decimalPart) {
    formatted += '.' + decimalPart;
  }
  
  return (isNegative ? '-' : '') + formatted;
}

export function parseIndianNumber(str: string): number {
  // Remove commas and parse as number
  const cleaned = str.replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

export function getIndianNumberLabel(num: number): string {
  const absNum = Math.abs(num);
  
  if (absNum >= 10000000) { // 1 crore
    const crores = absNum / 10000000;
    return `₹${crores.toFixed(1)} Crore${crores !== 1 ? 's' : ''}`;
  } else if (absNum >= 100000) { // 1 lakh
    const lakhs = absNum / 100000;
    return `₹${lakhs.toFixed(1)} Lakh${lakhs !== 1 ? 's' : ''}`;
  } else if (absNum >= 1000) { // 1 thousand
    const thousands = absNum / 1000;
    return `₹${thousands.toFixed(1)} Thousand`;
  } else {
    return `₹${absNum.toFixed(0)}`;
  }
}