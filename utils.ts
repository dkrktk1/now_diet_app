export const formatNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  
  // 반올림하여 소수점 1자리까지만 표시 (예: 10.55 -> 10.6)
  const rounded = Math.round(n * 10) / 10;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 1 });
};

export const formatDateDots = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}.${month}.${day}`;
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateString = (dateStr: string): number => {
  // Remove spaces
  let cleaned = dateStr.replace(/\s/g, '');
  // Remove trailing dot if exists
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }
  // Replace remaining dots with hyphens
  cleaned = cleaned.replace(/\./g, '-');
  
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) {
    return 0;
  }
  return date.getTime();
};
