import React, { useState, useMemo } from 'react';
import { DailyDiet, Meal } from '../types';

export type ExportMode = 'calendar' | 'week' | 'month' | 'year';

interface DataExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerName: string;
    allAdminDiets: { [key: string]: DailyDiet };
    allUserDiets: { [key: string]: DailyDiet };
    selectedDate?: Date;
    showNotification?: (message: string) => void;
}

const formatDateStr = (year: number, month: number, day: number): string => {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
};

const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
};

export const DataExportModal: React.FC<DataExportModalProps> = ({
    isOpen,
    onClose,
    playerName,
    allAdminDiets = {},
    allUserDiets = {},
    selectedDate = new Date(),
    showNotification
}) => {
    const [mode, setMode] = useState<ExportMode>('calendar');
    
    const availableYears = [2026, 2027, 2028, 2029, 2030];

    // Calendar mode state
    const [calendarYear, setCalendarYear] = useState<number>(() => Math.max(2026, selectedDate.getFullYear()));
    const [calendarMonth, setCalendarMonth] = useState<number>(selectedDate.getMonth() + 1); // 1-12
    const [selectedDates, setSelectedDates] = useState<Set<string>>(() => {
        const set = new Set<string>();
        const y = Math.max(2026, selectedDate.getFullYear());
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        set.add(`${y}-${m}-${d}`);
        return set;
    });
    const [calendarQuickSelection, setCalendarQuickSelection] = useState<'today' | 'month-all' | 'month-recorded' | null>(null);

    // Week mode state
    const [weekYear, setWeekYear] = useState<number>(() => Math.max(2026, selectedDate.getFullYear()));
    const [weekMonth, setWeekMonth] = useState<number>(selectedDate.getMonth() + 1);
    const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);

    // Month mode state
    const [monthYear, setMonthYear] = useState<number>(() => Math.max(2026, selectedDate.getFullYear()));
    const [selectedMonth, setSelectedMonth] = useState<number>(selectedDate.getMonth() + 1);

    // Year mode state
    const [selectedYear, setSelectedYear] = useState<number>(() => Math.max(2026, selectedDate.getFullYear()));

    // Export options
    const [onlyRecordedDays, setOnlyRecordedDays] = useState<boolean>(false);

    // Check if a date has recorded data
    const hasDietData = (dateStr: string): boolean => {
        const uDiet = allUserDiets[dateStr];
        const aDiet = allAdminDiets[dateStr];
        const uHas = uDiet && (uDiet.totalCalories > 0 || (uDiet.meals && uDiet.meals.some(m => m && (m.calories > 0 || (m.menu && m.menu.length > 0)))));
        const aHas = aDiet && (aDiet.totalCalories > 0 || (aDiet.meals && aDiet.meals.some(m => m && (m.calories > 0 || (m.menu && m.menu.length > 0)))));
        return Boolean(uHas || aHas);
    };

    // Calculate weeks for the selected weekYear/weekMonth
    const weeksList = useMemo(() => {
        const totalDays = getDaysInMonth(weekYear, weekMonth);
        const weeks: { index: number; label: string; startDate: string; endDate: string; dates: string[] }[] = [];
        
        let startDay = 1;
        let weekNum = 1;
        
        while (startDay <= totalDays) {
            const endDay = Math.min(startDay + 6, totalDays);
            const dates: string[] = [];
            for (let d = startDay; d <= endDay; d++) {
                dates.push(formatDateStr(weekYear, weekMonth, d));
            }
            
            const startStr = formatDateStr(weekYear, weekMonth, startDay);
            const endStr = formatDateStr(weekYear, weekMonth, endDay);
            
            weeks.push({
                index: weekNum - 1,
                label: `${weekNum}주차 (${weekMonth}/${startDay} ~ ${weekMonth}/${endDay})`,
                startDate: startStr,
                endDate: endStr,
                dates
            });

            startDay = endDay + 1;
            weekNum++;
        }

        return weeks;
    }, [weekYear, weekMonth]);

    // Calendar grid computation
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
        const firstDayOfWeek = new Date(calendarYear, calendarMonth - 1, 1).getDay(); // 0: Sun, 1: Mon...
        
        const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; hasData: boolean }[] = [];
        
        // Blank days before first day
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({
                dateStr: `empty-${i}`,
                dayNumber: 0,
                isCurrentMonth: false,
                hasData: false
            });
        }
        
        // Month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatDateStr(calendarYear, calendarMonth, d);
            days.push({
                dateStr,
                dayNumber: d,
                isCurrentMonth: true,
                hasData: hasDietData(dateStr)
            });
        }

        return days;
    }, [calendarYear, calendarMonth, allUserDiets, allAdminDiets]);

    // Compute effective dates to export based on current mode
    const effectiveDates = useMemo(() => {
        let dates: string[] = [];
        
        if (mode === 'calendar') {
            dates = Array.from(selectedDates).sort();
        } else if (mode === 'week') {
            const currentWeek = weeksList[selectedWeekIndex] || weeksList[0];
            dates = currentWeek ? currentWeek.dates : [];
        } else if (mode === 'month') {
            const totalDays = getDaysInMonth(monthYear, selectedMonth);
            for (let d = 1; d <= totalDays; d++) {
                dates.push(formatDateStr(monthYear, selectedMonth, d));
            }
        } else if (mode === 'year') {
            for (let m = 1; m <= 12; m++) {
                const totalDays = getDaysInMonth(selectedYear, m);
                for (let d = 1; d <= totalDays; d++) {
                    dates.push(formatDateStr(selectedYear, m, d));
                }
            }
        }

        if (onlyRecordedDays) {
            return dates.filter(d => hasDietData(d));
        }

        return dates;
    }, [mode, selectedDates, weeksList, selectedWeekIndex, monthYear, selectedMonth, selectedYear, onlyRecordedDays, allUserDiets, allAdminDiets]);

    if (!isOpen) return null;

    // Helpers for calendar selection
    const toggleDateSelection = (dateStr: string) => {
        setCalendarQuickSelection(null);
        setSelectedDates(prev => {
            const next = new Set(prev);
            if (next.has(dateStr)) {
                next.delete(dateStr);
            } else {
                next.add(dateStr);
            }
            return next;
        });
    };

    const handleSelectAllInMonth = () => {
        const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
        const next = new Set<string>();
        selectedDates.forEach(dateStr => {
            const [y, m] = dateStr.split('-').map(Number);
            if (y !== calendarYear || m !== calendarMonth) {
                next.add(dateStr);
            }
        });
        for (let d = 1; d <= daysInMonth; d++) {
            next.add(formatDateStr(calendarYear, calendarMonth, d));
        }
        setSelectedDates(next);
        setCalendarQuickSelection('month-all');
    };

    const handleSelectOnlyRecordedInMonth = () => {
        const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
        const next = new Set<string>();
        selectedDates.forEach(dateStr => {
            const [y, m] = dateStr.split('-').map(Number);
            if (y !== calendarYear || m !== calendarMonth) {
                next.add(dateStr);
            }
        });
        for (let d = 1; d <= daysInMonth; d++) {
            const dStr = formatDateStr(calendarYear, calendarMonth, d);
            if (hasDietData(dStr)) {
                next.add(dStr);
            }
        }
        setSelectedDates(next);
        setCalendarQuickSelection('month-recorded');
    };

    const handleClearCalendarSelection = () => {
        setSelectedDates(new Set());
        setCalendarQuickSelection(null);
    };

    const handleSelectToday = () => {
        const today = new Date();
        const tStr = formatDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());
        setCalendarYear(Math.max(2026, today.getFullYear()));
        setCalendarMonth(today.getMonth() + 1);
        setSelectedDates(new Set([tStr]));
        setCalendarQuickSelection('today');
    };

    // CSV Extraction Logic
    const getMealFoodItems = (userMeal?: Meal, adminMeal?: Meal): string[] => {
        const menu = (userMeal?.menu && userMeal.menu.length > 0) ? userMeal.menu : (adminMeal?.menu || []);
        if (!Array.isArray(menu)) return [];
        return menu
            .map(item => {
                if (!item) return '';
                if (typeof item === 'string') return item.trim();
                return (item.foodName || item.name || '').trim();
            })
            .filter(name => name.length > 0);
    };

    const handleExportCSV = () => {
        if (effectiveDates.length === 0) {
            showNotification?.('선택된 날짜 데이터가 없습니다.');
            return;
        }

        const currentName = playerName || '선수';

        // 1. Calculate maximum food count for each meal across all dates to keep columns aligned
        let maxMeal1 = 1;
        let maxMeal2 = 1;
        let maxMeal3 = 1;

        effectiveDates.forEach(dateStr => {
            const uDiet = allUserDiets[dateStr];
            const aDiet = allAdminDiets[dateStr];
            
            const f1 = getMealFoodItems(uDiet?.meals?.[0], aDiet?.meals?.[0]).length;
            const f2 = getMealFoodItems(uDiet?.meals?.[1], aDiet?.meals?.[1]).length;
            const f3 = getMealFoodItems(uDiet?.meals?.[2], aDiet?.meals?.[2]).length;

            if (f1 > maxMeal1) maxMeal1 = f1;
            if (f2 > maxMeal2) maxMeal2 = f2;
            if (f3 > maxMeal3) maxMeal3 = f3;
        });

        // 2. Build Headers
        const meal1Headers: string[] = [
            '식사 1 식사시간', '식사 1 섭취 칼로리', '식사 1 권장 칼로리', 
            '식사 1 탄수화물', '식사 1 단백질', '식사 1 지방'
        ];
        for (let i = 1; i <= maxMeal1; i++) {
            meal1Headers.push(`식사 1 세부 식사 ${i}`);
        }

        const meal2Headers: string[] = [
            '식사 2 식사시간', '식사 2 섭취 칼로리', '식사 2 권장 칼로리', 
            '식사 2 탄수화물', '식사 2 단백질', '식사 2 지방'
        ];
        for (let i = 1; i <= maxMeal2; i++) {
            meal2Headers.push(`식사 2 세부 식사 ${i}`);
        }

        const meal3Headers: string[] = [
            '식사 3 식사시간', '식사 3 섭취 칼로리', '식사 3 권장 칼로리', 
            '식사 3 탄수화물', '식사 3 단백질', '식사 3 지방'
        ];
        for (let i = 1; i <= maxMeal3; i++) {
            meal3Headers.push(`식사 3 세부 식사 ${i}`);
        }

        const headers = [
            '선수 이름',
            '날짜',
            '총 섭취 칼로리',
            '총 권장 칼로리',
            '탄수화물(섭취/권장)',
            '단백질(섭취/권장)',
            '지방(섭취/권장)',
            ...meal1Headers,
            ...meal2Headers,
            ...meal3Headers
        ];

        // 3. Build Rows
        const rows: any[][] = effectiveDates.map(dateStr => {
            const userDiet = allUserDiets[dateStr];
            const adminDiet = allAdminDiets[dateStr];

            const totalIntakeCal = userDiet?.totalCalories ?? 0;
            const totalTargetCal = adminDiet?.totalCalories ?? 0;
            const carbsIntake = userDiet?.totalMacros?.carbs ?? 0;
            const carbsTarget = adminDiet?.totalMacros?.carbs ?? 0;
            const proteinIntake = userDiet?.totalMacros?.protein ?? 0;
            const proteinTarget = adminDiet?.totalMacros?.protein ?? 0;
            const fatIntake = userDiet?.totalMacros?.fat ?? 0;
            const fatTarget = adminDiet?.totalMacros?.fat ?? 0;

            const formatMealData = (userMeal?: Meal, adminMeal?: Meal, maxCount: number = 1) => {
                const time = userMeal?.time || adminMeal?.time || '';
                const userCalories = userMeal?.calories ?? 0;
                const adminCalories = adminMeal?.calories ?? 0;
                const carbs = userMeal?.macros?.carbs ?? 0;
                const protein = userMeal?.macros?.protein ?? 0;
                const fat = userMeal?.macros?.fat ?? 0;
                const foods = getMealFoodItems(userMeal, adminMeal);

                const paddedFoods = [...foods];
                while (paddedFoods.length < maxCount) {
                    paddedFoods.push('');
                }

                return [time, userCalories, adminCalories, carbs, protein, fat, ...paddedFoods];
            };

            const m1Data = formatMealData(userDiet?.meals?.[0], adminDiet?.meals?.[0], maxMeal1);
            const m2Data = formatMealData(userDiet?.meals?.[1], adminDiet?.meals?.[1], maxMeal2);
            const m3Data = formatMealData(userDiet?.meals?.[2], adminDiet?.meals?.[2], maxMeal3);

            return [
                currentName,
                dateStr,
                totalIntakeCal,
                totalTargetCal,
                `${carbsIntake}/${carbsTarget}`,
                `${proteinIntake}/${proteinTarget}`,
                `${fatIntake}/${fatTarget}`,
                ...m1Data,
                ...m2Data,
                ...m3Data
            ];
        });

        // 4. Generate File Name
        let fileNameSuffix = '';
        if (mode === 'calendar') {
            if (effectiveDates.length === 1) {
                fileNameSuffix = effectiveDates[0].replace(/-/g, '');
            } else {
                fileNameSuffix = `선택${effectiveDates.length}일_${effectiveDates[0].replace(/-/g, '')}_${effectiveDates[effectiveDates.length - 1].replace(/-/g, '')}`;
            }
        } else if (mode === 'week') {
            fileNameSuffix = `${weekYear}년_${weekMonth}월_${selectedWeekIndex + 1}주차`;
        } else if (mode === 'month') {
            fileNameSuffix = `${monthYear}년_${selectedMonth}월`;
        } else if (mode === 'year') {
            fileNameSuffix = `${selectedYear}년`;
        }

        const fileName = `식단기록_${currentName}_${fileNameSuffix}.csv`;

        // 5. Build and Trigger Download
        const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        const csvContent = '\uFEFF' + [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.map(escapeCSV).join(','))
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification?.(`${effectiveDates.length}일치 CSV 파일이 다운로드되었습니다.`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-5 sm:p-6 max-w-2xl w-full border border-gray-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            선택 데이터 내보내기 (CSV)
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            대상 선수: <span className="text-blue-300 font-semibold">{playerName || '선수'}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
                    <button
                        type="button"
                        onClick={() => setMode('calendar')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col items-center justify-center min-h-[54px] border ${
                            mode === 'calendar'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span>📅</span>
                            <span>1. 캘린더 선택</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('week')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col items-center justify-center min-h-[54px] border ${
                            mode === 'week'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span>📆</span>
                            <span>2. 주차별</span>
                        </div>
                        <span className="text-2xs opacity-85 whitespace-nowrap leading-tight mt-0.5">
                            (1주일)
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('month')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col items-center justify-center min-h-[54px] border ${
                            mode === 'month'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span>🗓️</span>
                            <span>3. 월별</span>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('year')}
                        className={`py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col items-center justify-center min-h-[54px] border ${
                            mode === 'year'
                                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span>📊</span>
                            <span>4. 년도별</span>
                        </div>
                    </button>
                </div>

                {/* Tab Content Body */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {/* MODE 1: CALENDAR SELECTION */}
                    {mode === 'calendar' && (
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setCalendarQuickSelection(null);
                                            if (calendarMonth === 1) {
                                                setCalendarYear(y => Math.max(2026, y - 1));
                                                setCalendarMonth(12);
                                            } else {
                                                setCalendarMonth(m => m - 1);
                                            }
                                        }}
                                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs"
                                    >
                                        ◀
                                    </button>
                                    <span className="font-bold text-white text-base">
                                        {calendarYear}년 {calendarMonth}월
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setCalendarQuickSelection(null);
                                            if (calendarMonth === 12) {
                                                setCalendarYear(y => y + 1);
                                                setCalendarMonth(1);
                                            } else {
                                                setCalendarMonth(m => m + 1);
                                            }
                                        }}
                                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs"
                                    >
                                        ▶
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={handleSelectToday}
                                        className={`px-2.5 py-1 rounded-md transition-all border ${
                                            calendarQuickSelection === 'today'
                                                ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white font-bold shadow-sm'
                                                : 'bg-gray-700 hover:bg-gray-600 border-gray-600/50 text-gray-200'
                                        }`}
                                    >
                                        오늘
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllInMonth}
                                        className={`px-2.5 py-1 rounded-md transition-all border ${
                                            calendarQuickSelection === 'month-all'
                                                ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white font-bold shadow-sm'
                                                : 'bg-gray-700 hover:bg-gray-600 border-gray-600/50 text-gray-200'
                                        }`}
                                    >
                                        이달 전체
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSelectOnlyRecordedInMonth}
                                        className={`px-2.5 py-1 rounded-md transition-all border ${
                                            calendarQuickSelection === 'month-recorded'
                                                ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white font-bold shadow-sm'
                                                : 'bg-gray-700 hover:bg-gray-600 border-gray-600/50 text-gray-200'
                                        }`}
                                    >
                                        기록된 날만
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClearCalendarSelection}
                                        className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-md transition-colors"
                                    >
                                        초기화
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Days Table */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs">
                                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                                    <div key={day} className={`font-semibold py-1 ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                                        {day}
                                    </div>
                                ))}

                                {calendarDays.map((item, idx) => {
                                    if (!item.isCurrentMonth) {
                                        return <div key={`empty-${idx}`} className="h-9 sm:h-10" />;
                                    }

                                    const isSelected = selectedDates.has(item.dateStr);

                                    return (
                                        <button
                                            key={item.dateStr}
                                            type="button"
                                            onClick={() => toggleDateSelection(item.dateStr)}
                                            className={`h-9 sm:h-10 rounded-lg flex flex-col items-center justify-center relative transition-all border ${
                                                isSelected
                                                    ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-md'
                                                    : 'bg-gray-800/80 border-gray-700/60 text-gray-200 hover:bg-gray-700'
                                            }`}
                                        >
                                            <span className="text-xs">{item.dayNumber}</span>
                                            {item.hasData && (
                                                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> 식단 기록 있음
                                    </span>
                                </div>
                                <div>
                                    선택된 날짜: <span className="text-blue-300 font-bold">{selectedDates.size}개</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE 2: WEEK SELECTION */}
                    {mode === 'week' && (
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">연도 선택</label>
                                    <select
                                        value={weekYear}
                                        onChange={(e) => setWeekYear(Number(e.target.value))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {availableYears.map(y => (
                                            <option key={y} value={y}>{y}년</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">월 선택</label>
                                    <select
                                        value={weekMonth}
                                        onChange={(e) => {
                                            setWeekMonth(Number(e.target.value));
                                            setSelectedWeekIndex(0);
                                        }}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{m}월</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">주차 선택</label>
                                <div className="space-y-2">
                                    {weeksList.map((week) => {
                                        const isSelected = selectedWeekIndex === week.index;
                                        const recordedCount = week.dates.filter(d => hasDietData(d)).length;

                                        return (
                                            <button
                                                key={week.index}
                                                type="button"
                                                onClick={() => setSelectedWeekIndex(week.index)}
                                                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                                                    isSelected
                                                        ? 'bg-blue-600/30 border-blue-500 text-white shadow-md'
                                                        : 'bg-gray-800/80 border-gray-700/80 text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                <div>
                                                    <div className="font-semibold text-sm text-white">{week.label}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{week.startDate} ~ {week.endDate} ({week.dates.length}일간)</div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        recordedCount > 0 ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' : 'bg-gray-700 text-gray-400'
                                                    }`}>
                                                        {recordedCount}일 기록됨
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE 3: MONTH SELECTION */}
                    {mode === 'month' && (
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">연도 선택</label>
                                <select
                                    value={monthYear}
                                    onChange={(e) => setMonthYear(Number(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {availableYears.map(y => (
                                        <option key={y} value={y}>{y}년</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">월 선택</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                                        const isSelected = selectedMonth === m;
                                        const totalDaysInM = getDaysInMonth(monthYear, m);
                                        let recordedDays = 0;
                                        for (let d = 1; d <= totalDaysInM; d++) {
                                            if (hasDietData(formatDateStr(monthYear, m, d))) {
                                                recordedDays++;
                                            }
                                        }

                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setSelectedMonth(m)}
                                                className={`p-3 rounded-xl border text-center transition-all ${
                                                    isSelected
                                                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                                                        : 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                <div className="font-bold text-sm">{m}월</div>
                                                <div className="text-2xs text-gray-400 mt-1">
                                                    {recordedDays > 0 ? (
                                                        <span className="text-emerald-300">{recordedDays}일 기록</span>
                                                    ) : (
                                                        '기록 없음'
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE 4: YEAR SELECTION */}
                    {mode === 'year' && (
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-700/60 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1.5">내보낼 연도 선택</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white text-sm font-medium focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {availableYears.map(y => {
                                        let recordedDays = 0;
                                        for (let m = 1; m <= 12; m++) {
                                            const totalDaysInM = getDaysInMonth(y, m);
                                            for (let d = 1; d <= totalDaysInM; d++) {
                                                if (hasDietData(formatDateStr(y, m, d))) {
                                                    recordedDays++;
                                                }
                                            }
                                        }
                                        return (
                                            <option key={y} value={y}>
                                                {y}년 {recordedDays > 0 ? `(${recordedDays}일 식단 기록됨)` : '(기록 없음)'}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Year Summary Card */}
                            {(() => {
                                let totalRecordedInYear = 0;
                                for (let m = 1; m <= 12; m++) {
                                    const totalDaysInM = getDaysInMonth(selectedYear, m);
                                    for (let d = 1; d <= totalDaysInM; d++) {
                                        if (hasDietData(formatDateStr(selectedYear, m, d))) {
                                            totalRecordedInYear++;
                                        }
                                    }
                                }

                                return (
                                    <div className="p-3.5 bg-gray-800/80 border border-gray-700 rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white">{selectedYear}년 식단 데이터</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{selectedYear}년 1월 1일 ~ 12월 31일 (총 365일)</div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                                totalRecordedInYear > 0 
                                                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' 
                                                    : 'bg-gray-700 text-gray-400'
                                            }`}>
                                                {totalRecordedInYear > 0 ? `${totalRecordedInYear}일 기록됨` : '기록 없음'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="p-3 bg-blue-900/20 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                                💡 {selectedYear}년 1월 1일부터 12월 31일까지의 식단 데이터가 1개의 CSV 파일로 정리되어 내보내집니다.
                            </div>
                        </div>
                    )}

                    {/* Filter & Options */}
                    <div className="p-3.5 bg-gray-750/70 bg-gray-900/40 border border-gray-700/80 rounded-xl flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                            <input
                                type="checkbox"
                                checked={onlyRecordedDays}
                                onChange={(e) => setOnlyRecordedDays(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800"
                            />
                            <span>식단 기록이 존재하는 날짜만 내보내기 (기록 없는 날 제외)</span>
                        </label>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
                    <div className="text-xs text-gray-300">
                        총 <span className="text-blue-400 font-bold text-sm">{effectiveDates.length}일</span> 데이터가 내보내집니다.
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            disabled={effectiveDates.length === 0}
                            className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            CSV 다운로드 ({effectiveDates.length}일)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DataExportModal;
