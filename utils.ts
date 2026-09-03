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

export interface MonthWeekInfo {
  weekNumber: number;
  year: number;
  month: number;
  id: string; // e.g. "2026-09-W1"
  label: string; // e.g. "1주차 (8/31 ~ 9/6)"
  fullLabel: string; // e.g. "2026년 09월 1주차 (8/31 ~ 9/6)"
  startDate: string; // "2026-08-31" (월요일)
  endDate: string; // "2026-09-06" (일요일)
  dates: string[]; // 7 days ['2026-08-31', ..., '2026-09-06']
}

/**
 * 특정 연/월의 주차(월요일~일요일 기준) 목록을 반환합니다.
 * 해당 월 1일이 포함된 주의 월요일부터 시작하여, 마지막 날이 포함된 주의 일요일까지 생성합니다.
 * 예: 2026년 9월 1일(화) -> 1주차: 8월 31일(월) ~ 9월 6일(일)
 */
export const getWeeksForMonth = (year: number, month: number): MonthWeekInfo[] => {
  const weeks: MonthWeekInfo[] = [];
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0); // e.g. Sept 30
  
  // 1일의 요일 (0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토)
  const dayOfWeek = firstDayOfMonth.getDay();
  // 월요일까지의 오프셋: 월(1)->0, 화(2)->1, ..., 일(0)->6
  const diffToMonday = (dayOfWeek + 6) % 7;
  
  // 1주차 시작 월요일
  const currentMonday = new Date(year, month - 1, 1 - diffToMonday);
  let weekNum = 1;
  
  while (currentMonday <= lastDayOfMonth) {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + i);
      dates.push(formatDate(d));
    }
    
    const startD = new Date(currentMonday);
    const endD = new Date(currentMonday.getFullYear(), currentMonday.getMonth(), currentMonday.getDate() + 6);
    
    const startMonth = startD.getMonth() + 1;
    const startDay = startD.getDate();
    const endMonth = endD.getMonth() + 1;
    const endDay = endD.getDate();
    
    const startLabel = `${startMonth}/${startDay}`;
    const endLabel = `${endMonth}/${endDay}`;
    const monthStr = String(month).padStart(2, '0');
    
    weeks.push({
      weekNumber: weekNum,
      year,
      month,
      id: `${year}-${monthStr}-W${weekNum}`,
      label: `${weekNum}주차 (${startLabel} ~ ${endLabel})`,
      fullLabel: `${year}년 ${monthStr}월 ${weekNum}주차 (${startLabel} ~ ${endLabel})`,
      startDate: dates[0],
      endDate: dates[6],
      dates
    });
    
    currentMonday.setDate(currentMonday.getDate() + 7);
    weekNum++;
  }
  
  return weeks;
};
