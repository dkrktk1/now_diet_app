import React, { useState, useEffect } from 'react';
import { formatNumber, parseDateString, formatDate } from '../utils';
import { DailyDiet } from '../types';

interface WeightEntry {
  date: string;
  weight: number;
  muscleMass?: number;
  bodyFat?: number;
}

interface WeightTrackerProps {
  history: WeightEntry[];
  startWeight: number | null;
  startMuscleMass: number | null;
  startBodyFat: number | null;
  startDate?: string;
  userDiets?: Record<string, DailyDiet>;
  adminDiets?: Record<string, DailyDiet>;
  onAddBodyComposition?: (weight: number, muscleMass: number, bodyFat: number, date: Date) => void;
  onDeleteBodyComposition?: (date: Date) => void;
  selectedDate?: Date;
  weightForDate?: WeightEntry | null;
  showNotification?: (message: string) => void;
}

type Metric = 'weight' | 'muscleMass' | 'bodyFat';

const WeightTracker: React.FC<WeightTrackerProps> = ({ history, startWeight, startMuscleMass, startBodyFat, startDate, userDiets = {}, adminDiets = {}, onAddBodyComposition, onDeleteBodyComposition, selectedDate, weightForDate, showNotification }) => {
    // Correctly sort history by date to find the latest entry
    const sortedHistory = [...history].sort((a, b) => parseDateString(a.date) - parseDateString(b.date));
    const latestEntry = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;

    const latestMuscleEntry = [...sortedHistory].reverse().find(entry => entry.muscleMass && entry.muscleMass > 0);
    const currentMuscleMass = latestMuscleEntry ? latestMuscleEntry.muscleMass : null;

    const latestBodyFatEntry = [...sortedHistory].reverse().find(entry => entry.bodyFat && entry.bodyFat > 0);
    const currentBodyFat = latestBodyFatEntry ? latestBodyFatEntry.bodyFat : null;

    const [activeCategory, setActiveCategory] = useState<'bodyComposition' | 'mealTime' | 'calorie'>('bodyComposition');
    const [expandedCharts, setExpandedCharts] = useState<Record<Metric, boolean>>({
        weight: true,
        muscleMass: false,
        bodyFat: false
    });
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
    const [activeTooltip, setActiveTooltip] = useState<{ id?: string, x: number, y: number, text: string } | null>(null);
    const [mealTimeGraphMonth, setMealTimeGraphMonth] = useState<string>('all');
    const [calorieGraphMonth, setCalorieGraphMonth] = useState<string>('all');

    const [inputDate, setInputDate] = useState<string>(formatDate(selectedDate || new Date()));

    const dateFormattedForHistory = inputDate.replace(/-/g, '.');
    const weightForInputDate = history.find(entry => entry.date === dateFormattedForHistory) || null;

    const [weightInput, setWeightInput] = useState<string>(weightForInputDate ? String(weightForInputDate.weight) : '');
    const [muscleMassInput, setMuscleMassInput] = useState<string>(weightForInputDate?.muscleMass ? String(weightForInputDate.muscleMass) : '');
    const [bodyFatInput, setBodyFatInput] = useState<string>(weightForInputDate?.bodyFat ? String(weightForInputDate.bodyFat) : '');
    const [isEditingWeight, setIsEditingWeight] = useState<boolean>(!weightForInputDate);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    useEffect(() => {
        setWeightInput(weightForInputDate ? String(weightForInputDate.weight) : '');
        setMuscleMassInput(weightForInputDate?.muscleMass ? String(weightForInputDate.muscleMass) : '');
        setBodyFatInput(weightForInputDate?.bodyFat ? String(weightForInputDate.bodyFat) : '');
        setIsEditingWeight(!weightForInputDate);
    }, [inputDate, weightForInputDate]);

    const handleWeightSave = () => {
        const weightValue = parseFloat(weightInput);
        const muscleMassValue = parseFloat(muscleMassInput);
        const bodyFatValue = parseFloat(bodyFatInput);

        if (weightValue > 0) {
            const dateObj = new Date(inputDate);
            onAddBodyComposition?.(weightValue, muscleMassValue || 0, bodyFatValue || 0, dateObj);
            showNotification?.('저장이 완료되었습니다.');
            setIsEditingWeight(false);
        } else {
            showNotification?.("유효한 체중을 입력해주세요.");
        }
    };

    const handleWeightDelete = () => {
        if (onDeleteBodyComposition) {
            const dateObj = new Date(inputDate);
            onDeleteBodyComposition(dateObj);
            setWeightInput('');
            setMuscleMassInput('');
            setBodyFatInput('');
            setIsEditingWeight(false);
            setShowDeleteConfirm(false);
            showNotification?.('삭제되었습니다.');
        }
    };

    const toggleChart = (metric: Metric) => {
        setExpandedCharts(prev => ({ ...prev, [metric]: !prev[metric] }));
    };

    const toggleMonth = (month: string) => {
        setExpandedMonths(prev => {
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            const isCurrentlyExpanded = prev[month] ?? (month === currentMonth);
            return { ...prev, [month]: !isCurrentlyExpanded };
        });
    };

    const getMetricLabel = (metric: Metric) => {
        switch(metric) {
            case 'weight': return '체중';
            case 'muscleMass': return '골격근량';
            case 'bodyFat': return '체지방률';
        }
    };

    const getMetricUnit = (metric: Metric) => {
        return metric === 'bodyFat' ? '%' : 'kg';
    };

    const renderChart = (metric: Metric) => {
        const chartDataWithStart: { date: string, value: number }[] = [];
        
        // Add start value only for weight and bodyFat if available
        if (metric === 'weight' && startWeight !== null) {
            chartDataWithStart.push({ date: '시작', value: startWeight });
        } else if (metric === 'muscleMass' && startMuscleMass !== null) {
            chartDataWithStart.push({ date: '시작', value: startMuscleMass });
        } else if (metric === 'bodyFat' && startBodyFat !== null) {
            chartDataWithStart.push({ date: '시작', value: startBodyFat });
        }

        // Add history data
        sortedHistory.forEach(entry => {
            const val = entry[metric];
            if (val !== undefined && val !== null && val > 0) {
                chartDataWithStart.push({ date: entry.date, value: val });
            }
        });

        const data = chartDataWithStart.slice(-30); // Display max last 30 entries (including start)
        
        if (data.length < 2) {
            return (
                <div className="h-72 flex items-center justify-center bg-gray-700 rounded-lg">
                    <p className="text-gray-400 text-center text-base sm:text-lg">
                        그래프를 표시하려면 {getMetricLabel(metric)} 기록이 2개 이상 필요합니다.
                        <br/>
                        <span className="text-sm text-gray-500">(시작 데이터 포함)</span>
                    </p>
                </div>
            );
        }

        const width = 600;
        const height = 300;
        const padding = 50;

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const valRange = maxVal - minVal === 0 ? 10 : maxVal - minVal;
        const yMin = Math.floor(minVal - valRange * 0.1);
        const yMax = Math.ceil(maxVal + valRange * 0.1);
        const effectiveRange = yMax - yMin;

        const getX = (index: number) => padding + (index / (data.length - 1)) * (width - 2 * padding);
        const getY = (val: number) => height - padding - ((val - yMin) / effectiveRange) * (height - 2 * padding);

        const linePoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

        const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
            const value = yMin + (effectiveRange / 4) * i;
            return Math.round(value * 10) / 10;
        });

        return (
            <div className="bg-gray-700 p-2 sm:p-4 rounded-lg relative" onClick={() => setActiveTooltip(null)}>
                <h3 className="text-lg font-bold text-white mb-4 ml-2">{getMetricLabel(metric)} 변화</h3>
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby={`chart-title-${metric}`} role="img">
                    <title id={`chart-title-${metric}`}>최근 {getMetricLabel(metric)} 변화 그래프</title>

                    {/* Y Axis and Grid Lines */}
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4A5568" strokeWidth="1" />
                    {yAxisLabels.map((label, i) => (
                        <g key={`y-label-${i}`}>
                            <text x={padding - 8} y={getY(label) + 4} textAnchor="end" fill="#A0AEC0" fontSize="12">
                                {formatNumber(label)}{getMetricUnit(metric)}
                            </text>
                            <line x1={padding} y1={getY(label)} x2={width - padding} y2={getY(label)} stroke="#374151" strokeDasharray="3,3" />
                        </g>
                    ))}
                    
                    {/* X Axis */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4A5568" strokeWidth="1" />
                    {data.map((d, i) => {
                        const isFirst = i === 0;
                        const isLast = i === data.length - 1;
                        const isMiddle = i === Math.floor(data.length / 2);
                        if (isFirst || isLast || (isMiddle && !isFirst && !isLast)) {
                             let label = d.date;
                             let yearLabel = '';
                             if (d.date !== '시작') {
                                 label = d.date.substring(5).replace(/\./g, '/');
                                 yearLabel = d.date.substring(0, 4);
                             } else if (startDate) {
                                 yearLabel = startDate;
                             }
                            return (
                                <g key={`x-label-${i}`}>
                                    <text x={getX(i)} y={height - padding + 20} textAnchor="middle" fill="#A0AEC0" fontSize="12">
                                        {label}
                                    </text>
                                    {yearLabel && (
                                        <text x={getX(i)} y={height - padding + 34} textAnchor="middle" fill="#718096" fontSize="10">
                                            {yearLabel}
                                        </text>
                                    )}
                                </g>
                            );
                        }
                        return null;
                    })}

                    {/* Line */}
                    <polyline points={linePoints} fill="none" stroke="#4299E1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

                    {/* Points and Value Labels */}
                    {data.map((d, i) => (
                        <g key={`point-group-${i}`}>
                            {/* Visible point */}
                            <circle cx={getX(i)} cy={getY(d.value)} r="4" fill="#4299E1" stroke="#1A202C" strokeWidth="2" />
                            
                            {/* Invisible click target */}
                            <circle 
                                cx={getX(i)} 
                                cy={getY(d.value)} 
                                r="15" 
                                fill="transparent" 
                                className="cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip({
                                        id: metric,
                                        x: getX(i),
                                        y: getY(d.value),
                                        text: `${d.date}: ${formatNumber(d.value)}${getMetricUnit(metric)}`
                                    });
                                }}
                            />

                            <text
                                x={getX(i)}
                                y={getY(d.value) - 10}
                                textAnchor="middle"
                                fill="#FFFFFF"
                                fontSize="10"
                                fontWeight="bold"
                                className="pointer-events-none"
                            >
                                {formatNumber(d.value)}{getMetricUnit(metric)}
                            </text>
                        </g>
                    ))}
                </svg>

                {/* Custom Tooltip Overlay */}
                {activeTooltip && activeTooltip.id === metric && (
                    <div 
                        className="absolute bg-gray-800 text-white text-xs py-1.5 px-3 rounded shadow-lg border border-gray-600 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 whitespace-nowrap"
                        style={{
                            left: `${(activeTooltip.x / width) * 100}%`,
                            top: `calc(${(activeTooltip.y / height) * 100}% - 12px)`
                        }}
                    >
                        {activeTooltip.text}
                        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-600"></div>
                        <div className="absolute left-1/2 bottom-[1px] transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-gray-800"></div>
                    </div>
                )}
            </div>
        );
    };

    const renderCalorieAnalysis = () => {
        const sortedDates = Object.keys(userDiets).sort((a, b) => parseDateString(a) - parseDateString(b));
        
        if (sortedDates.length === 0) {
            return (
                <div className="h-72 flex items-center justify-center bg-gray-700 rounded-lg">
                    <p className="text-gray-400 text-center text-base sm:text-lg">
                        식단 데이터가 없습니다.
                    </p>
                </div>
            );
        }

        const allChartData = sortedDates.map(date => ({
            date,
            calories: userDiets[date].totalCalories || 0
        }));

        const getWeekIdentifier = (dateStr: string) => {
            const dt = new Date(dateStr);
            if (isNaN(dt.getTime())) return '';
            
            const firstDayOfMonth = new Date(dt.getFullYear(), dt.getMonth(), 1);
            const firstDayWeekday = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // 0 for Monday
            const offsetDate = dt.getDate() + firstDayWeekday - 1;
            const week = Math.floor(offsetDate / 7) + 1;
            
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-W${week}`;
        };

        const availableFilterOptions = new Set<string>();
        allChartData.forEach(d => {
            availableFilterOptions.add(d.date.substring(0, 7)); // Add month
            const weekId = getWeekIdentifier(d.date);
            if (weekId) availableFilterOptions.add(weekId); // Add week
        });
        
        // Sorting strategy: month first, then its weeks in descending order, overall descending
        const sortedFilterOptions = Array.from(availableFilterOptions).sort((a, b) => {
            const aIsWeek = a.includes('-W');
            const bIsWeek = b.includes('-W');
            const aMonth = a.substring(0, 7);
            const bMonth = b.substring(0, 7);
            
            if (aMonth !== bMonth) return bMonth.localeCompare(aMonth); // Month descending
            if (aIsWeek && bIsWeek) return b.localeCompare(a); // Week descending within month
            if (!aIsWeek && bIsWeek) return -1; // Month comes first before its weeks
            if (aIsWeek && !bIsWeek) return 1;
            return 0;
        });

        let chartData = calorieGraphMonth === 'all' 
            ? allChartData 
            : allChartData.filter(d => {
                if (calorieGraphMonth.includes('-W')) {
                    return getWeekIdentifier(d.date) === calorieGraphMonth;
                }
                return d.date.startsWith(calorieGraphMonth);
            });

        const renderSelectOptions = () => (
            <>
                <option value="all">전체보기</option>
                {sortedFilterOptions.map(option => {
                    let label = option;
                    if (option.includes('-W')) {
                        const [y, m, w] = option.split('-');
                        label = `   ${y}년 ${m}월 ${w.replace('W', '')}주차`;
                    } else {
                        label = option.replace('-', '년 ') + '월';
                    }
                    return (
                        <option key={option} value={option}>
                            {label}
                        </option>
                    );
                })}
            </>
        );

        if (chartData.length === 0) {
            return (
                <div className="space-y-6">
                    <div className="bg-gray-700 p-2 sm:p-4 rounded-lg relative">
                        <div className="flex justify-between items-center mb-4 ml-2">
                            <h3 className="text-lg font-bold text-white">총 섭취 칼로리 추이</h3>
                            <select
                                value={calorieGraphMonth}
                                onChange={(e) => setCalorieGraphMonth(e.target.value)}
                                className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                            >
                                {renderSelectOptions()}
                            </select>
                        </div>
                        <div className="h-64 flex items-center justify-center">
                            <p className="text-gray-400 text-center">해당 기간의 데이터가 없습니다.</p>
                        </div>
                    </div>
                </div>
            );
        }

        const width = 680;
        const height = 300;
        const padding = 50;
        const paddingRight = 130;

        const maxCalories = Math.max(...chartData.map(d => d.calories), 2000); // Default max 2000 if all are 0
        const yMax = Math.ceil(maxCalories / 500) * 500 + 500; // Round up to nearest 500 and add padding
        const yMin = 0;

        const getX = (index: number) => padding + (index / Math.max(1, chartData.length - 1)) * (width - padding - paddingRight);
        const getY = (val: number) => height - padding - ((val - yMin) / (yMax - yMin)) * (height - 2 * padding);

        const yAxisLabels = Array.from({ length: 5 }, (_, i) => yMin + (yMax - yMin) * (i / 4));

        const linePoints = chartData.map((d, i) => `${getX(i)},${getY(d.calories)}`).join(' ');
        
        const averageCalories = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.calories, 0) / chartData.length : 0;
        const averageY = getY(averageCalories);

        return (
            <div className="space-y-6">
                <div className="bg-gray-700 p-2 sm:p-4 rounded-lg relative" onClick={() => setActiveTooltip(null)}>
                    <div className="flex justify-between items-center mb-4 ml-2">
                        <h3 className="text-lg font-bold text-white">총 섭취 칼로리 추이</h3>
                        <select
                            value={calorieGraphMonth}
                            onChange={(e) => setCalorieGraphMonth(e.target.value)}
                            className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                        >
                            {renderSelectOptions()}
                        </select>
                    </div>
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                        {/* Y Axis and Grid Lines */}
                        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4A5568" strokeWidth="1" />
                        {yAxisLabels.map((label, i) => (
                            <g key={`y-label-${i}`}>
                                <text x={padding - 8} y={getY(label) + 4} textAnchor="end" fill="#A0AEC0" fontSize="12">
                                    {label}
                                </text>
                                <line x1={padding} y1={getY(label)} x2={width - paddingRight} y2={getY(label)} stroke="#374151" strokeDasharray="3,3" />
                            </g>
                        ))}
                        
                        {/* Average Line */}
                        {chartData.length > 0 && (
                            <g>
                                <line 
                                    x1={padding} 
                                    y1={averageY} 
                                    x2={width - paddingRight} 
                                    y2={averageY} 
                                    stroke="#9CA3AF" 
                                    strokeWidth="2" 
                                    strokeDasharray="5,5" 
                                />
                                <text 
                                    x={width - paddingRight + 10} 
                                    y={averageY + 4} 
                                    textAnchor="start" 
                                    fill="#9CA3AF" 
                                    fontSize="12"
                                    fontWeight="bold"
                                >
                                    평균: {formatNumber(averageCalories)} kcal
                                </text>
                            </g>
                        )}

                        {/* X Axis */}
                        <line x1={padding} y1={height - padding} x2={width - paddingRight} y2={height - padding} stroke="#4A5568" strokeWidth="1" />
                        {chartData.map((d, i) => {
                            const isWeeklyView = calorieGraphMonth.includes('-W');
                            const isFirst = i === 0;
                            const isLast = i === chartData.length - 1;
                            const isMiddle = i === Math.floor(chartData.length / 2);
                            if (isWeeklyView || isFirst || isLast || (isMiddle && !isFirst && !isLast)) {
                                const dateParts = d.date.split('-');
                                const month = parseInt(dateParts[1], 10);
                                const day = parseInt(dateParts[2], 10);
                                const label = `${month}.${day}`;
                                return (
                                    <text key={`x-label-${i}`} x={getX(i)} y={height - padding + 20} textAnchor="middle" fill="#A0AEC0" fontSize="12">
                                        {label}
                                    </text>
                                );
                            }
                            return null;
                        })}

                        {/* Line */}
                        <polyline points={linePoints} fill="none" stroke="#F6AD55" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                        
                        {/* Points (invisible for tooltips) */}
                        {chartData.map((d, i) => (
                            <circle 
                                key={`point-${i}`} 
                                cx={getX(i)} 
                                cy={getY(d.calories)} 
                                r="10" 
                                fill="transparent" 
                                stroke="transparent" 
                                className="cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip({
                                        id: 'calorie',
                                        x: getX(i),
                                        y: getY(d.calories),
                                        text: `${d.date}: ${formatNumber(d.calories)} kcal`
                                    });
                                }}
                            >
                                <title>{`${d.date}: ${formatNumber(d.calories)} kcal`}</title>
                            </circle>
                        ))}
                    </svg>
                    
                    {/* Custom Tooltip Overlay */}
                    {activeTooltip && activeTooltip.id === 'calorie' && (
                        <div 
                            className="absolute bg-gray-800 text-white text-xs py-1.5 px-3 rounded shadow-lg border border-gray-600 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 whitespace-nowrap"
                            style={{
                                left: `${(activeTooltip.x / width) * 100}%`,
                                top: `calc(${(activeTooltip.y / height) * 100}% - 12px)`
                            }}
                        >
                            {activeTooltip.text}
                            {/* Tooltip Arrow */}
                            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-600"></div>
                            <div className="absolute left-1/2 bottom-[1px] transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-gray-800"></div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <div className="mb-4 ml-2">
                        <h3 className="text-lg font-bold text-white">상세 섭취 내용</h3>
                        <p className="text-sm text-blue-400 mt-1 font-medium">
                            {calorieGraphMonth === 'all' ? '전체보기' : (() => {
                                if (calorieGraphMonth.includes('-W')) {
                                    const [, m, w] = calorieGraphMonth.split('-');
                                    return `${parseInt(m, 10)}월 ${w.replace('W', '')}주차`;
                                }
                                const [, m] = calorieGraphMonth.split('-');
                                return `${parseInt(m, 10)}월`;
                            })()}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...chartData].reverse().map((d, idx) => {
                            const diet = userDiets[d.date];
                            if (!diet) return null;
                            
                            const renderMeal = (mealNameLike: string, label: string, dotColor: string = 'bg-gray-500') => {
                                const meal = diet.meals.find(m => m.name.includes(mealNameLike));
                                if (!meal || meal.calories === 0) return null;
                                return (
                                    <div className="flex justify-between items-center text-xs border-t border-gray-700 pt-2 mt-2">
                                        <span className="text-white font-medium flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                                            {label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-light">{formatNumber(meal.calories)} kcal</span>
                                            <span className="text-[10px] w-[130px] text-right flex gap-1 justify-end whitespace-nowrap">
                                                <span className="text-white"><span className="text-yellow-500 mr-0.5">탄:</span>{formatNumber(meal.macros.carbs)}</span>
                                                <span className="text-white"><span className="text-green-500 mr-0.5">단:</span>{formatNumber(meal.macros.protein)}</span>
                                                <span className="text-white"><span className="text-red-400 mr-0.5">지:</span>{formatNumber(meal.macros.fat)}</span>
                                            </span>
                                        </div>
                                    </div>
                                );
                            };

                            let adminDiet = adminDiets[d.date];
                            if (!adminDiet || adminDiet.totalCalories === 0) {
                                const adminDates = Object.keys(adminDiets).sort((a, b) => parseDateString(b) - parseDateString(a));
                                const currentMs = parseDateString(d.date);
                                for (const aDate of adminDates) {
                                    if (adminDiets[aDate] && adminDiets[aDate].totalCalories > 0 && parseDateString(aDate) <= currentMs) {
                                        adminDiet = adminDiets[aDate];
                                        break;
                                    }
                                }
                            }
                            
                            const recCalories = adminDiet ? adminDiet.totalCalories : 0;
                            const recCarbs = adminDiet ? adminDiet.totalMacros.carbs : 0;
                            const recProtein = adminDiet ? adminDiet.totalMacros.protein : 0;
                            const recFat = adminDiet ? adminDiet.totalMacros.fat : 0;

                            return (
                                <div key={`macro-card-${idx}`} className="bg-gray-800 border-l-4 border-blue-500 rounded-lg p-5 shadow-lg flex flex-col justify-between">
                                    <div>
                                        <div className="text-white font-semibold tracking-wider mb-2 flex justify-between items-center">
                                            <span>{d.date.replace(/-/g, '.')}</span>
                                        </div>
                                        <div className="text-white text-lg sm:text-xl tracking-tight mb-2 flex items-baseline whitespace-nowrap pb-1 font-light">
                                            <span className="text-xs sm:text-sm mr-1 sm:mr-2">총 섭취</span>
                                            <span className={recCalories > 0 && diet.totalCalories > recCalories ? 'font-bold' : ''}>
                                                {formatNumber(diet.totalCalories)} <span className="text-xs sm:text-sm font-light">kcal</span>
                                            </span>
                                            <span className="text-xs sm:text-sm mx-1 sm:mx-2">/ 총 권장</span>
                                            <span className="flex items-center gap-0.5 sm:gap-1">
                                                {formatNumber(recCalories)} <span className="text-xs sm:text-sm">kcal</span>
                                                {recCalories > 0 && diet.totalCalories > recCalories && <span className="text-red-400 text-xs sm:text-sm">▲</span>}
                                                {recCalories > 0 && diet.totalCalories < recCalories && <span className="text-blue-400 text-xs sm:text-sm">▼</span>}
                                            </span>
                                        </div>
                                        <div className="text-[11px] xl:text-xs mb-4 flex justify-between w-full text-white tracking-tight font-light">
                                            <span><span className="text-yellow-500 font-medium">탄</span>: <span className={recCarbs > 0 && diet.totalMacros.carbs > recCarbs ? 'font-bold' : ''}>{formatNumber(diet.totalMacros.carbs)}</span> / {formatNumber(recCarbs)}g</span>
                                            <span><span className="text-green-500 font-medium">단</span>: <span className={recProtein > 0 && diet.totalMacros.protein > recProtein ? 'font-bold' : ''}>{formatNumber(diet.totalMacros.protein)}</span> / {formatNumber(recProtein)}g</span>
                                            <span><span className="text-red-400 font-medium">지</span>: <span className={recFat > 0 && diet.totalMacros.fat > recFat ? 'font-bold' : ''}>{formatNumber(diet.totalMacros.fat)}</span> / {formatNumber(recFat)}g</span>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            {renderMeal('식사1', '식사1', 'bg-yellow-400')}
                                            {renderMeal('식사2', '식사2', 'bg-green-400')}
                                            {renderMeal('식사3', '식사3', 'bg-red-400')}
                                            {renderMeal('간식', '기타', 'bg-gray-500')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderMealTimeAnalysis = () => {
        const sortedDates = Object.keys(userDiets).sort((a, b) => parseDateString(a) - parseDateString(b));
        
        if (sortedDates.length === 0) {
            return (
                <div className="h-72 flex items-center justify-center bg-gray-700 rounded-lg">
                    <p className="text-gray-400 text-center text-base sm:text-lg">
                        식사 시간 데이터가 없습니다.
                    </p>
                </div>
            );
        }

        const parseTime = (timeStr?: string) => {
            if (!timeStr) return null;
            const [hours, minutes] = timeStr.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes)) return null;
            let decimalTime = hours + minutes / 60;
            if (decimalTime < 4) decimalTime += 24; // Handle times past midnight (0~3 AM)
            return decimalTime;
        };

        const formatTimeFromDecimal = (decimalTime: number) => {
            const hours = Math.floor(decimalTime) % 24;
            const minutes = Math.round((decimalTime - Math.floor(decimalTime)) * 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };

        const mealTypes = ['식사1', '식사2', '식사3'];
        const colors = { '식사1': '#F6E05E', '식사2': '#68D391', '식사3': '#FC8181' };

        const chartData = sortedDates.map(date => {
            const diet = userDiets[date];
            const dataPoint: any = { date };
            mealTypes.forEach(type => {
                const reverseMap: Record<string, string> = {
                    '식사1': '아침',
                    '식사2': '점심',
                    '식사3': '저녁'
                };
                const meal = diet.meals.find(m => m.name === type || m.name === reverseMap[type]);
                dataPoint[type] = meal ? parseTime(meal.time) : null;
                dataPoint[`${type}TimeStr`] = meal?.time || '-';
            });
            return dataPoint;
        });

        const width = 600;
        const height = 300;
        const padding = 50;

        const groupedByMonth = chartData.reduce((acc, d) => {
            const month = d.date.substring(0, 7); // YYYY-MM
            if (!acc[month]) acc[month] = [];
            acc[month].push(d);
            return acc;
        }, {} as Record<string, typeof chartData>);

        const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a)); // Descending order

        const filteredChartData = mealTimeGraphMonth === 'all' 
            ? chartData 
            : chartData.filter(d => d.date.startsWith(mealTimeGraphMonth));

        const getX = (index: number) => padding + (index / Math.max(1, filteredChartData.length - 1)) * (width - 2 * padding);
        
        const mealTimeAxisConfig: Record<string, { min: number; max: number; labels: number[] }> = {
            '식사1': { min: 7, max: 15, labels: [7, 8, 9, 10, 11, 12, 13, 14, 15] },
            '식사2': { min: 11, max: 19, labels: [11, 12, 13, 14, 15, 16, 17, 18, 19] },
            '식사3': { min: 17, max: 26, labels: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26] }
        };

        const getY = (val: number, min: number, max: number) => padding + ((val - min) / (max - min)) * (height - 2 * padding);

        return (
            <div className="space-y-6">
                <div className="bg-gray-700 p-2 sm:p-4 rounded-lg relative" onClick={() => setActiveTooltip(null)}>
                    <div className="flex justify-between items-center mb-4 ml-2">
                        <h3 className="text-lg font-bold text-white">식사 시간 그래프</h3>
                        <select
                            value={mealTimeGraphMonth}
                            onChange={(e) => setMealTimeGraphMonth(e.target.value)}
                            className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">전체보기</option>
                            {sortedMonths.map(month => (
                                <option key={month} value={month}>
                                    {month.replace('-', '년 ')}월
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-8">
                        {mealTypes.map(type => {
                            const config = mealTimeAxisConfig[type] || { min: 4, max: 28, labels: [4, 8, 12, 16, 20, 24, 28] };
                            const validData = filteredChartData.filter(d => d[type] !== null);
                            
                            const linePoints = validData.map(d => `${getX(filteredChartData.indexOf(d))},${getY(d[type], config.min, config.max)}`).join(' ');

                            return (
                                <div key={type} className="bg-gray-800 p-2 sm:p-4 rounded-lg relative">
                                    <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2 ml-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[type as keyof typeof colors] }}></div>
                                        {type} 시간 추이
                                    </h4>
                                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                                        {/* Y Axis and Grid Lines */}
                                        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#4A5568" strokeWidth="1" />
                                        {config.labels.map((label, i) => (
                                            <g key={`y-label-${i}`}>
                                                <text x={padding - 8} y={getY(label, config.min, config.max) + 4} textAnchor="end" fill="#A0AEC0" fontSize="12">
                                                    {label >= 24 ? label - 24 : label}:00
                                                </text>
                                                <line x1={padding} y1={getY(label, config.min, config.max)} x2={width - padding} y2={getY(label, config.min, config.max)} stroke="#374151" strokeDasharray="3,3" />
                                            </g>
                                        ))}
                                        
                                        {/* X Axis */}
                                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4A5568" strokeWidth="1" />
                                        {filteredChartData.map((d, i) => {
                                            const isFirst = i === 0;
                                            const isLast = i === filteredChartData.length - 1;
                                            const isMiddle = i === Math.floor(filteredChartData.length / 2);
                                            if (isFirst || isLast || (isMiddle && !isFirst && !isLast)) {
                                                const label = d.date.substring(5).replace(/-/g, '/');
                                                return (
                                                    <text key={`x-label-${i}`} x={getX(i)} y={height - padding + 20} textAnchor="middle" fill="#A0AEC0" fontSize="12">
                                                        {label}
                                                    </text>
                                                );
                                            }
                                            return null;
                                        })}

                                        {/* Bars */}
                                        {filteredChartData.map((d, i) => {
                                            if (d[type] === null) return null;
                                            const y = getY(d[type], config.min, config.max);
                                            const barHeight = Math.max(0, height - padding - y);
                                            const barWidth = Math.min(30, (width - padding * 2) / Math.max(1, filteredChartData.length) * 0.6);
                                            const x = getX(i) - barWidth / 2;
                                            
                                            // Handle edge case where value might be exactly at yMin
                                            if (barHeight === 0) return null;

                                            return (
                                                <rect 
                                                    key={`bar-${type}-${i}`} 
                                                    x={x} 
                                                    y={y} 
                                                    width={barWidth} 
                                                    height={barHeight} 
                                                    fill={colors[type as keyof typeof colors]} 
                                                    opacity="0.3"
                                                    rx="4"
                                                    ry="4"
                                                    className="cursor-pointer hover:opacity-50 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTooltip({
                                                            id: `mealTime-${type}`,
                                                            x: getX(i),
                                                            y: getY(d[type], config.min, config.max),
                                                            text: `${d.date} ${type}: ${d[`${type}TimeStr`]}`
                                                        });
                                                    }}
                                                />
                                            );
                                        })}

                                        {/* Line */}
                                        {validData.length > 0 && <polyline points={linePoints} fill="none" stroke={colors[type as keyof typeof colors]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
                                        
                                        {/* Tooltip Points */}
                                        {validData.map((d, i) => {
                                            const originalIndex = filteredChartData.indexOf(d);
                                            return (
                                                <g key={`point-${type}-${i}`}>
                                                    <circle 
                                                        cx={getX(originalIndex)} 
                                                        cy={getY(d[type], config.min, config.max)} 
                                                        r="10" 
                                                        fill="transparent" 
                                                        stroke="transparent" 
                                                        className="cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveTooltip({
                                                                id: `mealTime-${type}`,
                                                                x: getX(originalIndex),
                                                                y: getY(d[type], config.min, config.max),
                                                                text: `${d.date} ${type}: ${d[`${type}TimeStr`]}`
                                                            });
                                                        }}
                                                    >
                                                        <title>{`${d.date} ${type}: ${d[`${type}TimeStr`]}`}</title>
                                                    </circle>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                    
                                    {/* Custom Tooltip Overlay */}
                                    {activeTooltip && activeTooltip.id === `mealTime-${type}` && (
                                        <div 
                                            className="absolute bg-gray-800 text-white text-xs py-1.5 px-3 rounded shadow-lg border border-gray-600 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 whitespace-nowrap"
                                            style={{
                                                left: `${(activeTooltip.x / width) * 100}%`,
                                                top: `calc(${(activeTooltip.y / height) * 100}% - 12px)`
                                            }}
                                        >
                                            {activeTooltip.text}
                                            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-600"></div>
                                            <div className="absolute left-1/2 bottom-[1px] transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-gray-800"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-2">날짜별 식사 시간</h3>
                    {sortedMonths.map(month => {
                        const now = new Date();
                        const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                        const isExpanded = expandedMonths[month] ?? (month === currentMonthStr);
                        const monthData = groupedByMonth[month];
                        
                        return (
                            <div key={month} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                <button
                                    onClick={() => toggleMonth(month)}
                                    className="w-full px-4 py-3 flex justify-between items-center bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                    <span className="font-bold text-white">{month.replace('-', '년 ')}월</span>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isExpanded && (
                                    <div className="p-4 bg-gray-800">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {[...monthData].reverse().map((d, i) => (
                                                <div key={`box-${d.date}`} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                                                    <div className="text-blue-400 font-bold mb-3 border-b border-gray-700 pb-2">{d.date}</div>
                                                    <div className="space-y-2">
                                                        {mealTypes.map(type => (
                                                            <div key={`box-meal-${type}`} className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[type as keyof typeof colors] }}></div>
                                                                    <span className="text-gray-300 text-sm">{type}</span>
                                                                </div>
                                                                <span className="text-white font-medium">{d[`${type}TimeStr`]}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-700 overflow-x-auto whitespace-nowrap">
                <button
                    className={`py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold transition-colors ${activeCategory === 'bodyComposition' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setActiveCategory('bodyComposition')}
                >
                    체성분 분석
                </button>
                <button
                    className={`py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold transition-colors ${activeCategory === 'mealTime' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setActiveCategory('mealTime')}
                >
                    식사시간 분석
                </button>
                <button
                    className={`py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold transition-colors ${activeCategory === 'calorie' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    onClick={() => setActiveCategory('calorie')}
                >
                    칼로리 분석
                </button>
            </div>

            {activeCategory === 'bodyComposition' && (
                <div className="space-y-8">
                    {onAddBodyComposition && (
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col gap-4 border border-gray-700">
                            <div className="flex justify-center items-center gap-2">
                                <h3 className="text-lg font-bold text-white text-center">체성분 기록</h3>
                                <input 
                                    type="date"
                                    value={inputDate}
                                    onChange={(e) => setInputDate(e.target.value)}
                                    className="bg-gray-700 text-white border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
                                <div className="flex flex-col items-center flex-1 sm:flex-none">
                                    <label htmlFor="today-weight" className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">체중 (kg)</label>
                                    <input
                                        id="today-weight"
                                        type="number"
                                        value={weightInput}
                                        onChange={(e) => setWeightInput(e.target.value)}
                                        placeholder="0"
                                        disabled={!isEditingWeight}
                                        className="bg-gray-700 border border-gray-600 rounded-md p-1.5 sm:p-2 w-full sm:w-24 text-center focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col items-center flex-1 sm:flex-none">
                                    <label htmlFor="today-muscle" className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">골격근량 (kg)</label>
                                    <input
                                        id="today-muscle"
                                        type="number"
                                        value={muscleMassInput}
                                        onChange={(e) => setMuscleMassInput(e.target.value)}
                                        placeholder="0"
                                        disabled={!isEditingWeight}
                                        className="bg-gray-700 border border-gray-600 rounded-md p-1.5 sm:p-2 w-full sm:w-24 text-center focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col items-center flex-1 sm:flex-none">
                                    <label htmlFor="today-fat" className="text-xs sm:text-sm font-semibold text-gray-300 mb-1">체지방률 (%)</label>
                                    <input
                                        id="today-fat"
                                        type="number"
                                        value={bodyFatInput}
                                        onChange={(e) => setBodyFatInput(e.target.value)}
                                        placeholder="0"
                                        disabled={!isEditingWeight}
                                        className="bg-gray-700 border border-gray-600 rounded-md p-1.5 sm:p-2 w-full sm:w-24 text-center focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center gap-2">
                                {isEditingWeight ? (
                                     <>
                                         <button 
                                            onClick={() => {
                                                setWeightInput(weightForInputDate ? String(weightForInputDate.weight) : '');
                                                setMuscleMassInput(weightForInputDate?.muscleMass ? String(weightForInputDate.muscleMass) : '');
                                                setBodyFatInput(weightForInputDate?.bodyFat ? String(weightForInputDate.bodyFat) : '');
                                                setIsEditingWeight(false);
                                            }}
                                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                                        >
                                            취소
                                        </button>
                                         <button 
                                            onClick={handleWeightSave}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition-colors"
                                        >
                                            저장
                                        </button>
                                     </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setIsEditingWeight(true)}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-8 rounded-lg transition-colors"
                                        >
                                            수정
                                        </button>
                                        {weightForInputDate && onDeleteBodyComposition && (
                                            <button 
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg transition-colors"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Weight Card */}
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <h3 className="text-gray-400 text-sm mb-1">현재 체중</h3>
                            <p className="text-2xl font-bold text-white">
                                {latestEntry ? formatNumber(latestEntry.weight) : '-'} <span className="text-sm text-gray-400">kg</span>
                            </p>
                            {startWeight && latestEntry && (
                                <p className={`text-xs mt-1 ${latestEntry.weight > startWeight ? 'text-red-400' : 'text-green-400'}`}>
                                    {latestEntry.weight > startWeight ? '+' : ''}{formatNumber(latestEntry.weight - startWeight)} kg (시작 대비)
                                </p>
                            )}
                        </div>

                        {/* Muscle Mass Card */}
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <h3 className="text-gray-400 text-sm mb-1">현재 골격근량</h3>
                            <p className="text-2xl font-bold text-white">
                                {currentMuscleMass ? formatNumber(currentMuscleMass) : '-'} <span className="text-sm text-gray-400">kg</span>
                            </p>
                             {startMuscleMass && currentMuscleMass && (
                                <p className={`text-xs mt-1 ${currentMuscleMass > startMuscleMass ? 'text-red-400' : 'text-green-400'}`}>
                                    {currentMuscleMass > startMuscleMass ? '+' : ''}{formatNumber(currentMuscleMass - startMuscleMass)} kg (시작 대비)
                                </p>
                            )}
                        </div>

                        {/* Body Fat Card */}
                        <div className="bg-gray-700 p-4 rounded-lg text-center">
                            <h3 className="text-gray-400 text-sm mb-1">현재 체지방률</h3>
                            <p className="text-2xl font-bold text-white">
                                {currentBodyFat ? formatNumber(currentBodyFat) : '-'} <span className="text-sm text-gray-400">%</span>
                            </p>
                             {startBodyFat && currentBodyFat && (
                                <p className={`text-xs mt-1 ${currentBodyFat > startBodyFat ? 'text-red-400' : 'text-green-400'}`}>
                                    {currentBodyFat > startBodyFat ? '+' : ''}{formatNumber(currentBodyFat - startBodyFat)} % (시작 대비)
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Charts Section */}
                    <div className="space-y-4">
                        {(['weight', 'muscleMass', 'bodyFat'] as Metric[]).map((metric) => (
                            <div key={metric} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                                <button
                                    onClick={() => toggleChart(metric)}
                                    className="w-full px-4 py-3 flex justify-between items-center bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                    <span className="font-bold text-white">{getMetricLabel(metric)} 변화</span>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedCharts[metric] ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {expandedCharts[metric] && (
                                    <div className="p-4 bg-gray-800">
                                        {renderChart(metric)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeCategory === 'mealTime' && renderMealTimeAnalysis()}
            {activeCategory === 'calorie' && renderCalorieAnalysis()}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">기록 삭제</h3>
                        <p className="text-gray-300 mb-6">
                            체중, 골격근량, 체지방률 기록을 정말 삭제하시겠습니까?<br/>
                            삭제된 데이터는 복구할 수 없습니다.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleWeightDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                삭제하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeightTracker;
