import React, { useState } from 'react';
import { DailyDiet, WeightEntry } from '../types';
import { formatNumber, formatDateDots, parseDateString } from '../utils';

interface MonthlyCalendarProps {
    onDateClick: (date: Date) => void;
    adminDiets: { [key: string]: DailyDiet };
    userDiets: { [key: string]: DailyDiet };
    weightHistory: WeightEntry[];
    autoApplyRecentDiet?: boolean;
    userRole?: 'admin' | 'player' | null;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ onDateClick, adminDiets, userDiets, weightHistory, autoApplyRecentDiet = false, userRole = 'player' }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

    const changeMonth = (amount: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const renderHeader = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.toLocaleString('ko-KR', { month: 'long' });

        return (
            <div className="flex flex-col gap-3 sm:flex-row items-start sm:items-center justify-between mb-4">
                 <div className="flex items-center gap-2 sm:gap-4">
                    <h2 className="text-lg sm:text-xl font-bold">{year}년 {month}</h2>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="이전 달">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="다음 달">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
                <button onClick={goToToday} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base">
                    오늘
                </button>
            </div>
        );
    };

    const renderDays = () => {
        return (
            <div className="grid grid-cols-7 text-center font-semibold text-gray-400 text-sm">
                {daysOfWeek.map((day, index) => (
                    <div key={day} className={`py-2 border-b border-gray-700 ${index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : ''}`}>{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

        const cells = [];
        // Previous month's days
        for (let i = firstDayOfMonth; i > 0; i--) {
            cells.push(
                <div key={`prev-${i}`} className="p-1 sm:p-2 h-28 sm:h-32 border-t-0 border-l-0 border-r border-b border-gray-700 text-gray-600">
                    <span className="text-sm">{lastDayOfPrevMonth - i + 1}</span>
                </div>
            );
        }

        // Current month's days
        const today = new Date();
        
        const getEffectiveAdminDiet = (dietKey: string) => {
            let diet = adminDiets[dietKey];
            if (!diet || diet.totalCalories === 0) {
                if (autoApplyRecentDiet && userRole === 'admin') {
                    const currentDateMs = new Date(dietKey).getTime();
                    const sortedDates = Object.keys(adminDiets).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                    const pastDates = sortedDates.filter(d => new Date(d).getTime() < currentDateMs);
                    if (pastDates.length > 0) {
                        const recentDiet = adminDiets[pastDates[0]];
                        if (recentDiet && recentDiet.totalCalories > 0) {
                            diet = recentDiet;
                        }
                    }
                }
            }
            return diet;
        };

        for (let day = 1; day <= lastDateOfMonth; day++) {
            const isToday = day === today.getDate() && year === today.getFullYear() && month === today.getMonth();
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();

            const dietKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dateStringForWeight = formatDateDots(date);
            
            const adminDietForDay = getEffectiveAdminDiet(dietKey);
            const userDietForDay = userDiets[dietKey];
            const weightEntryForDay = weightHistory.find(entry => entry.date === dateStringForWeight);

            let caloriePercent = 0;
            let percentColor = 'text-gray-400';
            const hasAdminDiet = adminDietForDay && adminDietForDay.totalCalories > 0;
            const hasUserDiet = userDietForDay && userDietForDay.totalCalories > 0;

            if (hasAdminDiet && hasUserDiet) {
                caloriePercent = (userDietForDay.totalCalories / adminDietForDay.totalCalories) * 100;
                if (caloriePercent > 100) percentColor = 'text-red-400';
                else if (caloriePercent === 100) percentColor = 'text-green-400';
                else percentColor = 'text-yellow-400';
            }

            cells.push(
                <div 
                    key={day} 
                    className={`p-1 sm:p-1.5 h-28 sm:h-32 border-t-0 border-l-0 border-r border-b border-gray-700 transition-colors hover:bg-gray-700/50 cursor-pointer flex flex-col ${isToday ? 'bg-blue-900/50' : ''}`}
                    onClick={() => onDateClick(date)}
                >
                    <span className={`text-xs sm:text-sm font-medium self-start ${isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center' : dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : ''}`}>{day}</span>
                    <div className="mt-1 space-y-1 text-xs overflow-hidden flex-grow">
                        {hasAdminDiet ? (
                            <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-md" title={`목표 달성률: ${formatNumber(caloriePercent)}%`}>
                                <span role="img" aria-label="식단" className="text-xs sm:text-sm">🍴</span>
                                 <span className={`truncate text-[10px] sm:text-xs font-bold ${percentColor}`}>{formatNumber(caloriePercent)}%</span>
                            </div>
                        ) : hasUserDiet ? (
                            <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-md" title={`섭취 칼로리: ${formatNumber(userDietForDay.totalCalories)}kcal`}>
                                <span role="img" aria-label="식단" className="text-xs sm:text-sm">🍴</span>
                                 <span className={`truncate text-[10px] sm:text-xs font-bold text-gray-200`}>{formatNumber(userDietForDay.totalCalories)}kcal</span>
                            </div>
                        ) : null}
                        {weightEntryForDay && (
                            <div className="flex flex-col gap-0.5 bg-gray-900/50 p-1 rounded-md">
                                <div className="flex items-center gap-1" title={`체중: ${formatNumber(weightEntryForDay.weight)} kg`}>
                                   <span role="img" aria-label="체중" className="text-[10px] sm:text-xs">⚖️</span>
                                    <span className="truncate text-gray-200 text-[9px] sm:text-[10px]">{formatNumber(weightEntryForDay.weight)}kg</span>
                                </div>
                                {weightEntryForDay.muscleMass && (
                                    <div className="flex items-center gap-1" title={`골격근량: ${formatNumber(weightEntryForDay.muscleMass)} kg`}>
                                       <span role="img" aria-label="골격근량" className="text-[10px] sm:text-xs">💪</span>
                                        <span className="truncate text-gray-200 text-[9px] sm:text-[10px]">{formatNumber(weightEntryForDay.muscleMass)}kg</span>
                                    </div>
                                )}
                                {weightEntryForDay.bodyFat && (
                                    <div className="flex items-center gap-1" title={`체지방률: ${formatNumber(weightEntryForDay.bodyFat)} %`}>
                                       <span role="img" aria-label="체지방률" className="text-[10px] sm:text-xs">🔥</span>
                                        <span className="truncate text-gray-200 text-[9px] sm:text-[10px]">{formatNumber(weightEntryForDay.bodyFat)}%</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        // Next month's days
        const totalCells = cells.length;
        const nextDays = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= nextDays; i++) {
             cells.push(
                <div key={`next-${i}`} className="p-1 sm:p-2 h-28 sm:h-32 border-t-0 border-l-0 border-r border-b border-gray-700 text-gray-600">
                    <span className="text-sm">{i}</span>
                </div>
            );
        }

        return <div className="grid grid-cols-7 border-l border-t border-gray-700">{cells}</div>;
    };


    return (
        <div>
             <h2 className="text-xl sm:text-2xl font-bold mb-4 text-blue-400">식단 캘린더</h2>
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
};

export default MonthlyCalendar;