import React from 'react';

interface DateNavigatorProps {
  selectedDate: Date;
  onNavigateToCalendar: () => void;
  onGoToToday: () => void;
  onDateChange: (newDate: Date) => void;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({ selectedDate, onNavigateToCalendar, onGoToToday, onDateChange }) => {
  const changeDay = (amount: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + amount);
    onDateChange(newDate);
  };

  return (
    <div className="bg-gray-800 p-3 sm:p-4 rounded-lg shadow-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => changeDay(-1)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="이전 날짜로 이동"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <h2 className="text-base sm:text-xl font-bold text-gray-300 text-center min-w-[240px] sm:min-w-[280px]">
          {selectedDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </h2>
        
        <button
          onClick={() => changeDay(1)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="다음 날짜로 이동"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        <button
          onClick={onNavigateToCalendar}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="식단 캘린더로 이동"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      <button
        onClick={onGoToToday}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:px-6 rounded-lg transition-colors w-full sm:w-auto"
      >
        오늘로 이동
      </button>
    </div>
  );
};

export default DateNavigator;