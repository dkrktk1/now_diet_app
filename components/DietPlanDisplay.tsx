import React, { useEffect, useState } from 'react';
import { DailyDiet, Meal, WeightEntry } from '../types';
import { formatNumber } from '../utils';
import { loadFrequentFoods, saveFrequentFoods } from '../services/firebaseService';
import DataExportModal from './DataExportModal';

interface DietPlanDisplayProps {
  adminDiet: DailyDiet;
  userDiet: DailyDiet;
  allAdminDiets?: { [key: string]: DailyDiet };
  allUserDiets?: { [key: string]: DailyDiet };
  setAdminDiet: React.Dispatch<React.SetStateAction<DailyDiet>>;
  setUserDiet: React.Dispatch<React.SetStateAction<DailyDiet>>;
  onAddBodyComposition?: (weight: number, muscleMass: number, bodyFat: number, date: Date) => void;
  onDeleteBodyComposition?: (date: Date) => void;
  showSaveButton?: boolean;
  onSave?: () => void;
  showNotification?: (message: string) => void;
  userRole?: 'admin' | 'player' | null;
  targetUserId?: string | null;
  playerName?: string;
  weightForDate?: WeightEntry | null;
  selectedDate?: Date;
  announcement?: string;
  setAnnouncement?: React.Dispatch<React.SetStateAction<string>>;
  autoApplyRecentDiet?: boolean;
  setAutoApplyRecentDiet?: (value: boolean) => void;
}

interface EditableMealCardProps {
    adminMeal: Meal;
    userMeal: Meal;
    mealIndex: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onAdminMealChange: (index: number, field: string, value: string) => void;
    onAdminMacroChange: (index: number, macro: 'protein' | 'carbs' | 'fat', value: string) => void;
    onAdminMenuChange: (index: number, value: any[]) => void;
    onUserMealChange: (index: number, field: string, value: string) => void;
    onUserMacroChange: (index: number, macro: 'protein' | 'carbs' | 'fat', value: string) => void;
    onUserMenuChange: (index: number, value: any[]) => void;
    userRole?: 'admin' | 'player' | null;
    userDiet: DailyDiet;
    onSaveMeal?: (mealName: string, userDiet: DailyDiet) => void;
    onClearUserMeal: (index: number) => void;
    onAddFrequentFoods?: (items: any[]) => void;
    onOpenFrequentFoodsList?: () => void;
}

const ProgressBar = ({ current, target, label, colorClass, showStatus = false }: { current: number, target: number, label: string, colorClass: string, showStatus?: boolean }) => {
    const percent = target > 0 ? (current / target) * 100 : 0;
    const displayPercent = target > 0 ? Math.min(percent, 100) : 0;
    const isOver = current > target && target > 0;
    const barColor = isOver ? 'bg-red-500' : colorClass;

    let statusIcon = null;
    let statusText = '';
    let statusColor = '';

    if (showStatus && target > 0) {
        if (percent > 100) {
            statusIcon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            );
            statusText = '초과';
            statusColor = 'text-red-400';
        } else if (percent === 100) {
            statusIcon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
            statusText = '달성';
            statusColor = 'text-green-400';
        } else {
            statusIcon = (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
            );
            statusText = '미만';
            statusColor = 'text-yellow-400';
        }
    }

    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs sm:text-sm mb-1">
                <span className="text-gray-300 font-medium">{label}</span>
                <span className="text-gray-400">
                    <span className={isOver ? 'text-red-400 font-bold' : 'text-white font-bold'}>{formatNumber(current)}</span> / {formatNumber(target)}
                    <span className="ml-1 font-bold text-gray-300">({formatNumber(percent)}%)</span>
                </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`} 
                    style={{ width: `${displayPercent}%` }}
                ></div>
            </div>
            {showStatus && target > 0 && (
                <div className={`mt-6 mb-2 flex flex-col items-center justify-center gap-2 text-xl sm:text-2xl font-black tracking-wider ${statusColor}`}>
                    <div className="bg-gray-800/80 p-3 rounded-full shadow-lg border border-gray-700/50">
                        {statusIcon}
                    </div>
                    <span>{statusText}</span>
                </div>
            )}
        </div>
    );
};

const MenuTable = ({ 
    items, onChange, disabled, title, titleColor, placeholder, onOpenSearch,
    showFrequentFoodFeatures = false,
    onAddFrequentFoods,
    onOpenFrequentFoodsList
}: { 
    items: any[], onChange: (items: any[]) => void, disabled: boolean, title: string, titleColor: string, placeholder?: string, onOpenSearch?: () => void,
    showFrequentFoodFeatures?: boolean,
    onAddFrequentFoods?: (selectedItems: any[]) => void,
    onOpenFrequentFoodsList?: () => void
}) => {
    const [checkedIndices, setCheckedIndices] = useState<number[]>([]);

    const normalizedItems = (items || []).map(item => {
        if (typeof item === 'string') {
            return { foodName: item, calories: '', carbs: '', protein: '', fat: '' };
        }
        return item;
    });

    const handleAddRow = () => {
        onChange([...normalizedItems, { foodName: '', calories: '', carbs: '', protein: '', fat: '' }]);
    };

    const handleRemoveRow = (index: number) => {
        const newItems = [...normalizedItems];
        newItems.splice(index, 1);
        onChange(newItems);
        setCheckedIndices(checkedIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    const handleChange = (index: number, field: string, value: string) => {
        const newItems = [...normalizedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    const toggleCheck = (index: number) => {
        if (checkedIndices.includes(index)) {
            setCheckedIndices(checkedIndices.filter(i => i !== index));
        } else {
            setCheckedIndices([...checkedIndices, index]);
        }
    };

    const handleAddFrequentFoods = () => {
        if (onAddFrequentFoods && checkedIndices.length > 0) {
            const selectedItems = checkedIndices.map(i => normalizedItems[i]);
            onAddFrequentFoods(selectedItems);
            setCheckedIndices([]); // Reset after adding
        }
    };

    return (
        <div className={`flex-1 p-4 rounded-lg border ${disabled ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-800 border-green-900/50 shadow-inner'}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                <label className={`font-medium ${titleColor} block text-sm`}>{title}</label>
                <div className="flex flex-wrap items-center gap-2">
                    {!disabled && showFrequentFoodFeatures && (
                        <>
                            <button 
                                onClick={handleAddFrequentFoods}
                                disabled={checkedIndices.length === 0}
                                className={`text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${checkedIndices.length > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                자주 먹는 음식 추가
                            </button>
                            <button 
                                onClick={onOpenFrequentFoodsList}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                자주 먹는 음식 불러오기
                            </button>
                        </>
                    )}
                    {!disabled && onOpenSearch && (
                        <button 
                            onClick={onOpenSearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 shrink-0"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            음식 검색
                        </button>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300 min-w-[400px]">
                    <thead className="text-xs text-gray-400 bg-gray-800 uppercase">
                        <tr>
                            {!disabled && showFrequentFoodFeatures && <th className="px-2 py-2 w-8 text-center">선택</th>}
                            <th className="px-2 py-2">음식종류</th>
                            <th className="px-2 py-2 w-16 text-center">칼로리</th>
                            <th className="px-2 py-2 w-16 text-center">탄수화물</th>
                            <th className="px-2 py-2 w-16 text-center">단백질</th>
                            <th className="px-2 py-2 w-16 text-center">지방</th>
                            {!disabled && <th className="px-2 py-2 w-8"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {normalizedItems.length === 0 && disabled && (
                            <tr>
                                <td colSpan={showFrequentFoodFeatures && !disabled ? 7 : 6} className="px-2 py-4 text-center text-gray-500 italic">
                                    {placeholder || "입력된 식단이 없습니다."}
                                </td>
                            </tr>
                        )}
                        {normalizedItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-700">
                                {!disabled && showFrequentFoodFeatures && (
                                    <td className="px-2 py-1 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={checkedIndices.includes(idx)}
                                            onChange={() => toggleCheck(idx)}
                                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                    </td>
                                )}
                                <td className="px-1 py-1">
                                    <input type="text" value={item.foodName || ''} onChange={e => handleChange(idx, 'foodName', e.target.value)} disabled={disabled} className={`w-full bg-transparent border-b border-gray-600 px-1 py-1 ${disabled ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-700'}`} placeholder="음식명" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="number" value={item.calories || ''} onChange={e => handleChange(idx, 'calories', e.target.value)} disabled={disabled} className={`w-full bg-transparent border-b border-gray-600 px-1 py-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-700'}`} placeholder="0" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="number" value={item.carbs || ''} onChange={e => handleChange(idx, 'carbs', e.target.value)} disabled={disabled} className={`w-full bg-transparent border-b border-gray-600 px-1 py-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-700'}`} placeholder="0" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="number" value={item.protein || ''} onChange={e => handleChange(idx, 'protein', e.target.value)} disabled={disabled} className={`w-full bg-transparent border-b border-gray-600 px-1 py-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-700'}`} placeholder="0" />
                                </td>
                                <td className="px-1 py-1">
                                    <input type="number" value={item.fat || ''} onChange={e => handleChange(idx, 'fat', e.target.value)} disabled={disabled} className={`w-full bg-transparent border-b border-gray-600 px-1 py-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-700'}`} placeholder="0" />
                                </td>
                                {!disabled && (
                                    <td className="px-1 py-1 text-center">
                                        <button type="button" onClick={() => handleRemoveRow(idx)} className="text-red-400 hover:text-red-300 p-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!disabled && (
                <button type="button" onClick={handleAddRow} className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    음식 추가
                </button>
            )}
        </div>
    );
};

const MealMacroSummary = ({ current, target, isSummary = false }: { current: any, target: any, isSummary?: boolean }) => {
    const currentCalories = current.calories || 0;
    const targetCalories = target.calories || 0;
    const remainingCalories = targetCalories - currentCalories;
    const isOverCalories = remainingCalories < 0;
    const caloriesPercent = targetCalories > 0 ? Math.min((currentCalories / targetCalories) * 100, 100) : 0;
    const caloriesRawPercent = targetCalories > 0 ? formatNumber((currentCalories / targetCalories) * 100) : 0;

    const currentCarbs = current.macros?.carbs || 0;
    const targetCarbs = target.macros?.carbs || 0;
    const carbsPercent = targetCarbs > 0 ? Math.min((currentCarbs / targetCarbs) * 100, 100) : 0;
    const carbsRawPercent = targetCarbs > 0 ? formatNumber((currentCarbs / targetCarbs) * 100) : 0;

    const currentProtein = current.macros?.protein || 0;
    const targetProtein = target.macros?.protein || 0;
    const proteinPercent = targetProtein > 0 ? Math.min((currentProtein / targetProtein) * 100, 100) : 0;
    const proteinRawPercent = targetProtein > 0 ? formatNumber((currentProtein / targetProtein) * 100) : 0;

    const currentFat = current.macros?.fat || 0;
    const targetFat = target.macros?.fat || 0;
    const fatPercent = targetFat > 0 ? Math.min((currentFat / targetFat) * 100, 100) : 0;
    const fatRawPercent = targetFat > 0 ? formatNumber((currentFat / targetFat) * 100) : 0;

    return (
        <div className="bg-[#2a2a2a] p-5 rounded-2xl mb-6 text-white shadow-md border border-gray-700/50">
            {/* Calories Header */}
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 ${isSummary ? 'mb-2' : 'mb-6'} text-sm sm:text-lg font-bold text-center`}>
                <div className="flex items-center gap-2">
                    <span className="text-orange-500 text-xl">🔥</span>
                    <span>
                        {isSummary ? '총 섭취 ' : '섭취 '}{formatNumber(currentCalories)} / {isSummary ? '총 권장 ' : '권장 '}{formatNumber(targetCalories)}kcal
                        {targetCalories > 0 && (
                            <span className="text-gray-400 ml-2 text-sm sm:text-base">({caloriesRawPercent}%)</span>
                        )}
                    </span>
                </div>
            </div>

            {isSummary && (
                <div className="mb-6 px-2 sm:px-8">
                    <div className="w-full bg-[#3a3a3a] rounded-full h-2.5 mb-2 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isOverCalories ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${caloriesPercent}%` }}></div>
                    </div>
                    {targetCalories > 0 && (
                        <div className="text-center text-xs sm:text-sm font-bold mt-2">
                            {isOverCalories ? (
                                <span className="text-red-400 flex items-center justify-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    {formatNumber(Math.abs(remainingCalories))}kcal 초과
                                </span>
                            ) : remainingCalories === 0 ? (
                                <span className="text-green-400 flex items-center justify-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    적정
                                </span>
                            ) : (
                                <span className="text-blue-400 flex items-center justify-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
                                    {formatNumber(remainingCalories)}kcal 부족
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center px-2 sm:px-8">
                {/* Carbs */}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-semibold mb-3 text-gray-100">탄수화물</span>
                    <div className="w-full bg-[#3a3a3a] rounded-full h-1.5 mb-3 overflow-hidden">
                        <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${carbsPercent}%` }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-100">
                        {formatNumber(currentCarbs)} / {formatNumber(targetCarbs)}g <span className="text-gray-400 font-normal ml-1">({carbsRawPercent}%)</span>
                    </span>
                </div>
                {/* Protein */}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-semibold mb-3 text-gray-100">단백질</span>
                    <div className="w-full bg-[#3a3a3a] rounded-full h-1.5 mb-3 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${proteinPercent}%` }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-100">
                        {formatNumber(currentProtein)} / {formatNumber(targetProtein)}g <span className="text-gray-400 font-normal ml-1">({proteinRawPercent}%)</span>
                    </span>
                </div>
                {/* Fat */}
                <div className="flex flex-col items-center">
                    <span className="text-sm font-semibold mb-3 text-gray-100">지방</span>
                    <div className="w-full bg-[#3a3a3a] rounded-full h-1.5 mb-3 overflow-hidden">
                        <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${fatPercent}%` }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-100">
                        {formatNumber(currentFat)} / {formatNumber(targetFat)}g <span className="text-gray-400 font-normal ml-1">({fatRawPercent}%)</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

import { FoodSearchModal } from './FoodSearchModal';

const EditableMealCard: React.FC<EditableMealCardProps> = ({ 
    adminMeal, userMeal, mealIndex, isExpanded, onToggleExpand, 
    onAdminMealChange, onAdminMacroChange, onAdminMenuChange,
    onUserMealChange, onUserMacroChange, onUserMenuChange,
    userRole, userDiet, onSaveMeal, onClearUserMeal,
    onAddFrequentFoods, onOpenFrequentFoodsList
}) => {
    const contentId = `meal-content-${mealIndex}`;
    const isAdmin = userRole === 'admin';
    const formatInputNumber = (val: any) => val ? Math.round(Number(val) * 10) / 10 : '';
    
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchTarget, setSearchTarget] = useState<'admin' | 'user'>('user');

    const mealNameMap: Record<string, string> = {
        '아침': '식사1',
        '점심': '식사2',
        '저녁': '식사3'
    };
    const displayName = mealNameMap[adminMeal.name] || adminMeal.name;

    const handleSearchComplete = (foods: any[]) => {
        if (searchTarget === 'admin') {
            const currentMenu = adminMeal.menu || [];
            onAdminMenuChange(mealIndex, [...currentMenu, ...foods]);
        } else {
            const currentMenu = userMeal.menu || [];
            onUserMenuChange(mealIndex, [...currentMenu, ...foods]);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 mb-6">
            <div className="flex justify-between items-center cursor-pointer mb-4" onClick={onToggleExpand}>
                <div className="flex items-center gap-3">
                    <h4 className="text-lg sm:text-xl font-bold text-blue-400">{displayName}</h4>
                    <div className="flex items-center gap-2">
                        <input
                            type="time"
                            value={userMeal.time || ''}
                            onChange={(e) => onUserMealChange(mealIndex, 'time', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-green-400 focus:ring-green-500 focus:border-green-500"
                            title="실제 섭취 시간"
                        />
                    </div>
                </div>
                 <button 
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-expanded={isExpanded}
                    aria-controls={contentId}
                    aria-label={isExpanded ? `${displayName} 항목 접기` : `${displayName} 항목 펼치기`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            {/* Meal Summary Progress Bars - Always visible */}
            <div className="mb-4">
                <MealMacroSummary current={userMeal} target={adminMeal} />
            </div>

            <div 
              id={contentId}
              className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                {/* Combined Target and Actual Intake - Grid Layout for Mobile */}
                <div className="bg-gray-900/80 rounded-lg border border-gray-700 p-3 sm:p-4 mb-6">
                    {/* Header */}
                    <div className="grid grid-cols-[60px_1fr_1fr] sm:grid-cols-[80px_1fr_1fr] gap-2 sm:gap-4 mb-3 pb-2 border-b border-gray-700 text-xs sm:text-sm font-semibold text-center items-center">
                        <div className="text-left text-gray-400">구분</div>
                        <div className="text-blue-300">권장 목표</div>
                        <div className="text-green-400">실제 섭취</div>
                    </div>

                    {/* Calories */}
                    <div className="grid grid-cols-[60px_1fr_1fr] sm:grid-cols-[80px_1fr_1fr] gap-2 sm:gap-4 items-center mb-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-300 leading-tight">칼로리<br className="sm:hidden"/><span className="text-[10px] sm:text-xs text-gray-500">(kcal)</span></div>
                        <div className="flex items-center justify-center">
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMealChange(mealIndex, 'calories', String(Math.max(0, (adminMeal.calories || 0) - 10)))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                </button>
                            )}
                            <input 
                                type={isAdmin ? "number" : "text"}
                                value={isAdmin ? formatInputNumber(adminMeal.calories) : formatNumber(adminMeal.calories)}
                                onChange={(e) => onAdminMealChange(mealIndex, 'calories', e.target.value)}
                                placeholder="0"
                                disabled={!isAdmin}
                                className={`w-full min-w-[30px] text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-800'}`}
                            />
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMealChange(mealIndex, 'calories', String((adminMeal.calories || 0) + 10))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </button>
                            )}
                        </div>
                        <div>
                            <input 
                                type={isAdmin ? "number" : "text"}
                                value={isAdmin ? formatInputNumber(userMeal.calories) : formatNumber(userMeal.calories)}
                                onChange={(e) => onUserMealChange(mealIndex, 'calories', e.target.value)}
                                placeholder="0"
                                disabled={!isAdmin}
                                className={`w-full text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-green-500 hover:bg-gray-800'}`}
                            />
                        </div>
                    </div>

                    {/* Carbs */}
                    <div className="grid grid-cols-[60px_1fr_1fr] sm:grid-cols-[80px_1fr_1fr] gap-2 sm:gap-4 items-center mb-3">
                        <div className="text-xs sm:text-sm font-medium text-yellow-400/80 leading-tight">탄수화물<br className="sm:hidden"/><span className="text-[10px] sm:text-xs text-yellow-600/80">(g)</span></div>
                        <div className="flex items-center justify-center">
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMacroChange(mealIndex, 'carbs', String(Math.max(0, (adminMeal.macros.carbs || 0) - 1)))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                </button>
                            )}
                            <input type={isAdmin ? "number" : "text"} value={isAdmin ? formatInputNumber(adminMeal.macros.carbs) : formatNumber(adminMeal.macros.carbs)} onChange={e => onAdminMacroChange(mealIndex, 'carbs', e.target.value)} placeholder="0" disabled={!isAdmin} className={`w-full min-w-[30px] text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-800'}`}/>
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMacroChange(mealIndex, 'carbs', String((adminMeal.macros.carbs || 0) + 1))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </button>
                            )}
                        </div>
                        <div>
                            <input type={isAdmin ? "number" : "text"} value={isAdmin ? formatInputNumber(userMeal.macros.carbs) : formatNumber(userMeal.macros.carbs)} onChange={e => onUserMacroChange(mealIndex, 'carbs', e.target.value)} placeholder="0" disabled={!isAdmin} className={`w-full text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-green-500 hover:bg-gray-800'}`}/>
                        </div>
                    </div>

                    {/* Protein */}
                    <div className="grid grid-cols-[60px_1fr_1fr] sm:grid-cols-[80px_1fr_1fr] gap-2 sm:gap-4 items-center mb-3">
                        <div className="text-xs sm:text-sm font-medium text-green-400/80 leading-tight">단백질<br className="sm:hidden"/><span className="text-[10px] sm:text-xs text-green-600/80">(g)</span></div>
                        <div className="flex items-center justify-center">
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMacroChange(mealIndex, 'protein', String(Math.max(0, (adminMeal.macros.protein || 0) - 1)))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                </button>
                            )}
                            <input type={isAdmin ? "number" : "text"} value={isAdmin ? formatInputNumber(adminMeal.macros.protein) : formatNumber(adminMeal.macros.protein)} onChange={e => onAdminMacroChange(mealIndex, 'protein', e.target.value)} placeholder="0" disabled={!isAdmin} className={`w-full min-w-[30px] text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-800'}`}/>
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMacroChange(mealIndex, 'protein', String((adminMeal.macros.protein || 0) + 1))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </button>
                            )}
                        </div>
                        <div>
                            <input type={isAdmin ? "number" : "text"} value={isAdmin ? formatInputNumber(userMeal.macros.protein) : formatNumber(userMeal.macros.protein)} onChange={e => onUserMacroChange(mealIndex, 'protein', e.target.value)} placeholder="0" disabled={!isAdmin} className={`w-full text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-green-500 hover:bg-gray-800'}`}/>
                        </div>
                    </div>

                    {/* Fat */}
                    <div className="grid grid-cols-[60px_1fr_1fr] sm:grid-cols-[80px_1fr_1fr] gap-2 sm:gap-4 items-center">
                        <div className="text-xs sm:text-sm font-medium text-red-400/80 leading-tight">지방<br className="sm:hidden"/><span className="text-[10px] sm:text-xs text-red-600/80">(g)</span></div>
                        <div className="flex items-center justify-center">
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMacroChange(mealIndex, 'fat', String(Math.max(0, (adminMeal.macros.fat || 0) - 1)))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                </button>
                            )}
                            <input type={isAdmin ? "number" : "text"} value={isAdmin ? formatInputNumber(adminMeal.macros.fat) : formatNumber(adminMeal.macros.fat)} onChange={e => onAdminMacroChange(mealIndex, 'fat', e.target.value)} placeholder="0" disabled={!isAdmin} className={`w-full min-w-[30px] text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-blue-500 hover:bg-gray-800'}`}/>
                            {isAdmin && (
                                <button type="button" onClick={() => onAdminMacroChange(mealIndex, 'fat', String((adminMeal.macros.fat || 0) + 1))} className="text-gray-400 hover:text-blue-400 p-1 shrink-0">
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </button>
                            )}
                        </div>
                        <div>
                            <input type={isAdmin ? "number" : "text"} value={isAdmin ? formatInputNumber(userMeal.macros.fat) : formatNumber(userMeal.macros.fat)} onChange={e => onUserMacroChange(mealIndex, 'fat', e.target.value)} placeholder="0" disabled={!isAdmin} className={`w-full text-center bg-transparent border-b border-gray-600 p-1 text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isAdmin ? 'cursor-default' : 'focus:border-green-500 hover:bg-gray-800'}`}/>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Admin Menu Input */}
                    <MenuTable 
                        items={adminMeal.menu || []} 
                        onChange={(newMenu) => onAdminMenuChange(mealIndex, newMenu)} 
                        disabled={!isAdmin} 
                        title="권장 식단 내용 (관리자용)" 
                        titleColor="text-blue-300"
                        placeholder="관리자가 권장 식단을 입력합니다."
                        onOpenSearch={() => {
                            setSearchTarget('admin');
                            setIsSearchModalOpen(true);
                        }}
                    />

                    {/* User Menu Input (Separated) */}
                    <div className="flex-1 flex flex-col gap-3">
                        <MenuTable 
                            items={userMeal.menu || []} 
                            onChange={(newMenu) => onUserMenuChange(mealIndex, newMenu)} 
                            disabled={false} 
                            title="실제 섭취 내용 (선수/관리자 입력)" 
                            titleColor="text-green-400"
                            placeholder="실제로 먹은 음식을 입력하세요."
                            onOpenSearch={() => {
                                setSearchTarget('user');
                                setIsSearchModalOpen(true);
                            }}
                            showFrequentFoodFeatures={true}
                            onAddFrequentFoods={onAddFrequentFoods}
                            onOpenFrequentFoodsList={onOpenFrequentFoodsList}
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={() => onClearUserMeal(mealIndex)}
                                className="bg-red-600/20 hover:bg-red-600 border border-red-500 text-red-50 hover:text-white font-bold py-1.5 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                섭취 내용 삭제
                            </button>
                            <button 
                                onClick={() => onSaveMeal && onSaveMeal(displayName, userDiet)}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded-lg transition-colors text-sm flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                섭취 내용 저장
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <FoodSearchModal 
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onComplete={handleSearchComplete}
            />
        </div>
    );
};


const DietPlanDisplay: React.FC<DietPlanDisplayProps> = ({ 
    adminDiet, userDiet, allAdminDiets = {}, allUserDiets = {}, setAdminDiet, setUserDiet, 
    onAddBodyComposition, onDeleteBodyComposition, 
    showSaveButton, onSave, showNotification, userRole, 
    targetUserId, playerName, weightForDate, selectedDate, 
    announcement = '', setAnnouncement, 
    autoApplyRecentDiet, setAutoApplyRecentDiet 
}) => {
    const [weightInput, setWeightInput] = useState<string>(weightForDate ? String(weightForDate.weight) : '');
    const [muscleMassInput, setMuscleMassInput] = useState<string>(weightForDate?.muscleMass ? String(weightForDate.muscleMass) : '');
    const [bodyFatInput, setBodyFatInput] = useState<string>(weightForDate?.bodyFat ? String(weightForDate.bodyFat) : '');
    const [isEditingWeight, setIsEditingWeight] = useState<boolean>(!weightForDate);
    const [expandedMeals, setExpandedMeals] = useState<boolean[]>(adminDiet.meals.map(() => true));
    const [isEditingAnnouncement, setIsEditingAnnouncement] = useState<boolean>(false);
    const [tempAnnouncement, setTempAnnouncement] = useState<string>(announcement);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
    
    const [frequentFoods, setFrequentFoods] = useState<any[]>([]);
    const [isFrequentFoodsModalOpen, setIsFrequentFoodsModalOpen] = useState(false);
    const [activeMealIndexForFrequentFoods, setActiveMealIndexForFrequentFoods] = useState<number | null>(null);

    useEffect(() => {
        if (targetUserId) {
            loadFrequentFoods(targetUserId).then(foods => {
                if (foods) setFrequentFoods(foods);
            });
        }
    }, [targetUserId]);

    const handleAddFrequentFoods = async (items: any[]) => {
        if (!targetUserId) return;
        const newFoods = [...frequentFoods];
        let addedCount = 0;
        
        items.forEach(item => {
            // Avoid duplicates by foodName
            if (!newFoods.some(f => f.foodName === item.foodName)) {
                newFoods.push(item);
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            setFrequentFoods(newFoods);
            await saveFrequentFoods(targetUserId, newFoods);
            showNotification?.(`${addedCount}개의 음식이 자주 먹는 음식에 추가되었습니다.`);
        } else {
            showNotification?.('이미 자주 먹는 음식에 등록되어 있습니다.');
        }
    };

    const handleOpenFrequentFoodsList = (mealIndex: number) => {
        setActiveMealIndexForFrequentFoods(mealIndex);
        setIsFrequentFoodsModalOpen(true);
    };

    const handleSelectFrequentFoods = (selectedItems: any[]) => {
        if (activeMealIndexForFrequentFoods === null) return;
        
        const currentMenu = userDiet.meals[activeMealIndexForFrequentFoods]?.menu || [];
        const updatedMenu = [...currentMenu, ...selectedItems];
        
        handleUserMenuChange(activeMealIndexForFrequentFoods, updatedMenu);
        
        setIsFrequentFoodsModalOpen(false);
        setActiveMealIndexForFrequentFoods(null);
        showNotification?.('자주 먹는 음식이 추가되었습니다.');
    };

    const handleDeleteFrequentFood = async (index: number) => {
        if (!targetUserId) return;
        const newFoods = [...frequentFoods];
        newFoods.splice(index, 1);
        setFrequentFoods(newFoods);
        await saveFrequentFoods(targetUserId, newFoods);
        showNotification?.('자주 먹는 음식 목록에서 삭제되었습니다.');
    };

    useEffect(() => {
        setTempAnnouncement(announcement);
    }, [announcement]);
    
    const noAdminDiet = userRole === 'player' && (!adminDiet || adminDiet.totalCalories === 0);

    useEffect(() => {
        setWeightInput(weightForDate ? String(weightForDate.weight) : '');
        setMuscleMassInput(weightForDate?.muscleMass ? String(weightForDate.muscleMass) : '');
        setBodyFatInput(weightForDate?.bodyFat ? String(weightForDate.bodyFat) : '');
        setIsEditingWeight(!weightForDate);
    }, [weightForDate]);
    
    const calculateTotals = (meals: Meal[]) => {
        const totalCalories = meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
        const totalMacros = meals.reduce((sum, meal) => ({
            protein: sum.protein + Number(meal.macros.protein || 0),
            carbs: sum.carbs + Number(meal.macros.carbs || 0),
            fat: sum.fat + Number(meal.macros.fat || 0),
        }), { protein: 0, carbs: 0, fat: 0 });
        
        return { 
            totalCalories: Math.round(totalCalories * 10) / 10, 
            totalMacros: {
                protein: Math.round(totalMacros.protein * 10) / 10,
                carbs: Math.round(totalMacros.carbs * 10) / 10,
                fat: Math.round(totalMacros.fat * 10) / 10
            }
        };
    };

    const handleAdminMealChange = (index: number, field: string, value: string) => {
        const newMeals = [...adminDiet.meals];
        const mealToUpdate = { ...newMeals[index] };
        if (field === 'calories') mealToUpdate.calories = Number(value) || 0;
        else (mealToUpdate as any)[field] = value;
        newMeals[index] = mealToUpdate;
        const { totalCalories, totalMacros } = calculateTotals(newMeals);
        setAdminDiet({ ...adminDiet, meals: newMeals, totalCalories, totalMacros });
    };

    const handleAdminMacroChange = (index: number, macro: 'protein' | 'carbs' | 'fat', value: string) => {
        const newMeals = [...adminDiet.meals];
        const mealToUpdate = { ...newMeals[index], macros: { ...newMeals[index].macros }};
        mealToUpdate.macros[macro] = Number(value) || 0;
        newMeals[index] = mealToUpdate;
        const { totalCalories, totalMacros } = calculateTotals(newMeals);
        setAdminDiet({ ...adminDiet, meals: newMeals, totalCalories, totalMacros });
    };

    const handleAdminMenuChange = (mealIndex: number, value: any[]) => {
        const newMeals = [...adminDiet.meals];
        const mealToUpdate = { ...newMeals[mealIndex] };
        mealToUpdate.menu = value;
        
        // Auto-calculate meal totals from menu items
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;
        
        value.forEach(item => {
            if (item) {
                mealCalories += Number(item.calories) || 0;
                mealProtein += Number(item.protein) || 0;
                mealCarbs += Number(item.carbs) || 0;
                mealFat += Number(item.fat) || 0;
            }
        });
        
        mealToUpdate.calories = Math.round(mealCalories * 10) / 10;
        mealToUpdate.macros = {
            protein: Math.round(mealProtein * 10) / 10,
            carbs: Math.round(mealCarbs * 10) / 10,
            fat: Math.round(mealFat * 10) / 10
        };
        
        newMeals[mealIndex] = mealToUpdate;
        const { totalCalories, totalMacros } = calculateTotals(newMeals);
        setAdminDiet({ ...adminDiet, meals: newMeals, totalCalories, totalMacros });
    };

    const handleUserMealChange = (index: number, field: string, value: string) => {
        const newMeals = [...userDiet.meals];
        const mealToUpdate = { ...newMeals[index] };
        if (field === 'calories') mealToUpdate.calories = Number(value) || 0;
        else (mealToUpdate as any)[field] = value;
        newMeals[index] = mealToUpdate;
        const { totalCalories, totalMacros } = calculateTotals(newMeals);
        setUserDiet({ ...userDiet, meals: newMeals, totalCalories, totalMacros });
    };

    const handleClearUserMeal = (index: number) => {
        const newMeals = [...userDiet.meals];
        newMeals[index] = {
            ...newMeals[index],
            time: '',
            calories: 0,
            macros: { protein: 0, carbs: 0, fat: 0 },
            menu: []
        };
        const { totalCalories, totalMacros } = calculateTotals(newMeals);
        setUserDiet({ ...userDiet, meals: newMeals, totalCalories, totalMacros });

        const mealNameMap: Record<string, string> = {
            '아침': '식사1',
            '점심': '식사2',
            '저녁': '식사3'
        };
        const displayName = mealNameMap[newMeals[index].name] || newMeals[index].name;

        showNotification?.(`${displayName} 섭취 내역이 삭제되었습니다.`);
    };

    const handleUserMacroChange = (index: number, macro: 'protein' | 'carbs' | 'fat', value: string) => {
        const newMeals = [...userDiet.meals];
        const mealToUpdate = { ...newMeals[index], macros: { ...newMeals[index].macros }};
        mealToUpdate.macros[macro] = Number(value) || 0;
        newMeals[index] = mealToUpdate;
        const { totalCalories, totalMacros } = calculateTotals(newMeals);
        setUserDiet({ ...userDiet, meals: newMeals, totalCalories, totalMacros });
    };

    const handleUserMenuChange = (mealIndex: number, value: any[]) => {
        const newMeals = [...userDiet.meals];
        const mealToUpdate = { ...newMeals[mealIndex] };
        mealToUpdate.menu = value;
        
        // Auto-calculate meal totals from menu items
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;
        
        value.forEach(item => {
            if (item) {
                mealCalories += Number(item.calories) || 0;
                mealProtein += Number(item.protein) || 0;
                mealCarbs += Number(item.carbs) || 0;
                mealFat += Number(item.fat) || 0;
            }
        });
        
        mealToUpdate.calories = Math.round(mealCalories * 10) / 10;
        mealToUpdate.macros = {
            protein: Math.round(mealProtein * 10) / 10,
            carbs: Math.round(mealCarbs * 10) / 10,
            fat: Math.round(mealFat * 10) / 10
        };
        
        newMeals[mealIndex] = mealToUpdate;
        const { totalCalories, totalMacros } = calculateTotals(newMeals);
        setUserDiet({ ...userDiet, meals: newMeals, totalCalories, totalMacros });
    };
    
    const handleToggleExpand = (index: number) => {
        setExpandedMeals(prev => {
            const newExpanded = [...prev];
            newExpanded[index] = !newExpanded[index];
            return newExpanded;
        });
    };

    const handleWeightSave = () => {
        const weightValue = parseFloat(weightInput);
        const muscleMassValue = parseFloat(muscleMassInput);
        const bodyFatValue = parseFloat(bodyFatInput);

        if (weightValue > 0 && selectedDate) {
            onAddBodyComposition?.(weightValue, muscleMassValue || 0, bodyFatValue || 0, selectedDate);
            showNotification?.('저장이 완료되었습니다.');
            setIsEditingWeight(false);
        } else {
            showNotification?.("유효한 체중을 입력해주세요.");
        }
    };

    const handleWeightDelete = () => {
        if (selectedDate && onDeleteBodyComposition) {
            onDeleteBodyComposition(selectedDate);
            setWeightInput('');
            setMuscleMassInput('');
            setBodyFatInput('');
            setIsEditingWeight(false);
            setShowDeleteConfirm(false);
            showNotification?.('삭제되었습니다.');
        }
    };

    const handleAnnouncementSave = () => {
        if (setAnnouncement) {
            setAnnouncement(tempAnnouncement);
            setIsEditingAnnouncement(false);
            showNotification?.('공지사항이 저장되었습니다.');
        }
    };

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

    const getMealCSVSection = (mealNumber: number, userMeal?: Meal, adminMeal?: Meal) => {
        const time = userMeal?.time || adminMeal?.time || '';
        const userCalories = userMeal?.calories ?? 0;
        const adminCalories = adminMeal?.calories ?? 0;
        const carbs = userMeal?.macros?.carbs ?? 0;
        const protein = userMeal?.macros?.protein ?? 0;
        const fat = userMeal?.macros?.fat ?? 0;
        const foodItems = getMealFoodItems(userMeal, adminMeal);

        const baseHeaders = [
            `식사 ${mealNumber} 식사시간`,
            `식사 ${mealNumber} 섭취 칼로리`,
            `식사 ${mealNumber} 권장 칼로리`,
            `식사 ${mealNumber} 탄수화물`,
            `식사 ${mealNumber} 단백질`,
            `식사 ${mealNumber} 지방`
        ];

        const foodHeaders = foodItems.length > 0
            ? foodItems.map((_, idx) => `식사 ${mealNumber} 세부 식사 ${idx + 1}`)
            : [`식사 ${mealNumber} 세부 식사 내용`];

        const baseValues = [time, userCalories, adminCalories, carbs, protein, fat];
        const foodValues = foodItems.length > 0 ? foodItems : [''];

        return {
            headers: [...baseHeaders, ...foodHeaders],
            values: [...baseValues, ...foodValues]
        };
    };

    const handleDownloadCSV = () => {
        const currentName = playerName || '선수';
        const dateObj = selectedDate || new Date();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStrFormatted = `${year}-${month}-${day}`;
        const dateStrForFile = `${year}${month}${day}`;

        const totalIntakeCal = userDiet?.totalCalories ?? 0;
        const totalTargetCal = adminDiet?.totalCalories ?? 0;
        const carbsIntake = userDiet?.totalMacros?.carbs ?? 0;
        const carbsTarget = adminDiet?.totalMacros?.carbs ?? 0;
        const proteinIntake = userDiet?.totalMacros?.protein ?? 0;
        const proteinTarget = adminDiet?.totalMacros?.protein ?? 0;
        const fatIntake = userDiet?.totalMacros?.fat ?? 0;
        const fatTarget = adminDiet?.totalMacros?.fat ?? 0;

        const meal1 = getMealCSVSection(1, userDiet?.meals?.[0], adminDiet?.meals?.[0]);
        const meal2 = getMealCSVSection(2, userDiet?.meals?.[1], adminDiet?.meals?.[1]);
        const meal3 = getMealCSVSection(3, userDiet?.meals?.[2], adminDiet?.meals?.[2]);

        const headers = [
            '선수 이름',
            '날짜',
            '총 섭취 칼로리',
            '총 권장 칼로리',
            '탄수화물(섭취/권장)',
            '단백질(섭취/권장)',
            '지방(섭취/권장)',
            ...meal1.headers,
            ...meal2.headers,
            ...meal3.headers
        ];

        const rowData = [
            currentName,
            dateStrFormatted,
            totalIntakeCal,
            totalTargetCal,
            `${carbsIntake}/${carbsTarget}`,
            `${proteinIntake}/${proteinTarget}`,
            `${fatIntake}/${fatTarget}`,
            ...meal1.values,
            ...meal2.values,
            ...meal3.values
        ];

        const escapeCSV = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

        const csvContent = '\uFEFF' + [
            headers.map(escapeCSV).join(','),
            rowData.map(escapeCSV).join(',')
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `식단기록_${currentName}_${dateStrForFile}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification?.('CSV 파일이 다운로드되었습니다.');
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-5 sm:p-6 rounded-xl shadow-lg border border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        오늘 식단 요약
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-end sm:self-auto">
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setIsExportModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 sm:py-2 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
                                title="기간 및 조건을 선택하여 데이터 내보내기"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                선택 데이터 내보내기
                            </button>

                            <button
                                onClick={handleDownloadCSV}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 sm:py-2 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 shrink-0"
                                title="현재 날짜 식단 데이터를 CSV로 다운로드"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                오늘 데이터 내보내기
                            </button>
                        </div>

                        {userRole === 'admin' && setAutoApplyRecentDiet && (
                            <label className="flex items-center cursor-pointer bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-colors h-full">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only" 
                                        checked={autoApplyRecentDiet} 
                                        onChange={(e) => setAutoApplyRecentDiet(e.target.checked)} 
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${autoApplyRecentDiet ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoApplyRecentDiet ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <div className="ml-3 text-sm font-medium text-gray-300">
                                    최근 권장 목표 자동 적용
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                {/* Announcement Section */}
                <div className="mb-6 bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-blue-300 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            관리자 공지사항
                        </h4>
                        {userRole === 'admin' && !isEditingAnnouncement && (
                            <button 
                                onClick={() => setIsEditingAnnouncement(true)}
                                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                            >
                                수정
                            </button>
                        )}
                    </div>
                    
                    {isEditingAnnouncement && userRole === 'admin' ? (
                        <div className="space-y-2">
                            <textarea
                                value={tempAnnouncement}
                                onChange={(e) => setTempAnnouncement(e.target.value)}
                                placeholder="선수들에게 전달할 공지사항을 입력하세요."
                                className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => {
                                        setTempAnnouncement(announcement);
                                        setIsEditingAnnouncement(false);
                                    }}
                                    className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded transition-colors"
                                >
                                    취소
                                </button>
                                <button 
                                    onClick={handleAnnouncementSave}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-200 whitespace-pre-wrap">
                            {announcement ? announcement : <span className="text-gray-500 italic">등록된 공지사항이 없습니다.</span>}
                        </div>
                    )}
                </div>

                {noAdminDiet && <p className="text-yellow-400 text-sm mb-4 bg-yellow-400/10 p-3 rounded-md border border-yellow-400/20">관리자가 입력한 권장 식단 정보가 없습니다.</p>}
                
                <MealMacroSummary 
                    current={{ calories: userDiet.totalCalories, macros: userDiet.totalMacros }} 
                    target={{ calories: adminDiet.totalCalories, macros: adminDiet.totalMacros }} 
                    isSummary={true}
                />
            </div>

            <div className="space-y-6">
                {adminDiet.meals.map((meal, index) => (
                    <EditableMealCard 
                        key={index} 
                        adminMeal={meal}
                        userMeal={userDiet.meals[index]}
                        mealIndex={index} 
                        isExpanded={expandedMeals[index]}
                        onToggleExpand={() => handleToggleExpand(index)}
                        onAdminMealChange={handleAdminMealChange} 
                        onAdminMacroChange={handleAdminMacroChange} 
                        onAdminMenuChange={handleAdminMenuChange}
                        onUserMealChange={handleUserMealChange}
                        onUserMacroChange={handleUserMacroChange}
                        onUserMenuChange={handleUserMenuChange}
                        userRole={userRole}
                        userDiet={userDiet}
                        onClearUserMeal={handleClearUserMeal}
                        onAddFrequentFoods={handleAddFrequentFoods}
                        onOpenFrequentFoodsList={() => handleOpenFrequentFoodsList(index)}
                        onSaveMeal={(mealName, currentDiet) => {
                            setUserDiet(currentDiet);
                            showNotification?.(`${mealName} 섭취량이 저장되었습니다.`);
                        }}
                    />
                ))}
            </div>
            {showSaveButton && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={onSave}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 text-lg rounded-xl shadow-lg transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        관리자 식단 저장
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal for Body Composition */}
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
            
            {/* Frequent Foods Modal */}
            {isFrequentFoodsModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">자주 먹는 음식</h3>
                            <button onClick={() => setIsFrequentFoodsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 mb-4 pr-2">
                            {frequentFoods.length === 0 ? (
                                <p className="text-gray-400 text-center py-8">저장된 자주 먹는 음식이 없습니다.</p>
                            ) : (
                                <div className="space-y-2">
                                    {frequentFoods.map((food, idx) => (
                                        <div key={idx} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-white">{food.foodName}</div>
                                                <div className="text-xs text-gray-300 flex gap-2 mt-1">
                                                    <span>칼로리: {food.calories || 0}</span>
                                                    <span>탄: {food.carbs || 0}</span>
                                                    <span>단: {food.protein || 0}</span>
                                                    <span>지: {food.fat || 0}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button 
                                                    onClick={() => handleSelectFrequentFoods([food])}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    추가
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteFrequentFood(idx)}
                                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end pt-2 border-t border-gray-700">
                            <button 
                                onClick={() => setIsFrequentFoodsModalOpen(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DataExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                playerName={playerName || '선수'}
                allAdminDiets={allAdminDiets}
                allUserDiets={allUserDiets}
                selectedDate={selectedDate}
                showNotification={showNotification}
            />
        </div>
    );
};

export default DietPlanDisplay;