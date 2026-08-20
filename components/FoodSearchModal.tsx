import React, { useState, useEffect, useRef } from 'react';
import { formatNumber } from '../utils';

interface FoodItem {
    category: string;
    name: string;
    'serving size': string;
    kcal: number;
    carbs: number;
    protein: number;
    fat: number;
}

interface SelectedFood extends FoodItem {
    intake: number;
    calculatedKcal: number;
    calculatedCarbs: number;
    calculatedProtein: number;
    calculatedFat: number;
}

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (foods: any[]) => void;
}

const DB_URL = 'https://script.google.com/macros/s/AKfycbxKiBf5b_INyA1tl06rPhhggoNceTQzk1z0g-ZJtgnOOxRBcMY2jYXStTik4JgREISi/exec';

let cachedDatabase: FoodItem[] | null = null;

export const FoodSearchModal: React.FC<FoodSearchModalProps> = ({ isOpen, onClose, onComplete }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
    const [tempList, setTempList] = useState<SelectedFood[]>([]);
    
    // Search input ref to maintain focus & prevent IME reset
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch database once
    useEffect(() => {
        if (isOpen && !cachedDatabase) {
            setIsLoading(true);
            fetch(DB_URL)
                .then(res => res.json())
                .then(data => {
                    cachedDatabase = Array.isArray(data) ? data : [];
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch food database:", err);
                    cachedDatabase = [];
                    setIsLoading(false);
                });
        }
    }, [isOpen]);

    // Focus input on modal open & reset state when closed
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setSearchQuery('');
            setSearchResults([]);
            setTempList([]);
        }
    }, [isOpen]);

    // Local debounced search
    useEffect(() => {
        if (!cachedDatabase || !searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        
        const timer = setTimeout(() => {
            const query = searchQuery.toLowerCase().trim();
            const results = cachedDatabase!.filter(food => {
                const nameStr = food.name ? String(food.name).toLowerCase() : '';
                return nameStr.includes(query);
            });
            
            // Search priority sorting
            results.sort((a, b) => {
                const nameA = String(a.name || '').toLowerCase();
                const nameB = String(b.name || '').toLowerCase();
                
                // 1. Exact match
                if (nameA === query && nameB !== query) return -1;
                if (nameB === query && nameA !== query) return 1;
                
                // 2. Starts with query
                const startsWithA = nameA.startsWith(query);
                const startsWithB = nameB.startsWith(query);
                if (startsWithA && !startsWithB) return -1;
                if (!startsWithA && startsWithB) return 1;
                
                // 3. Shorter name length
                if (nameA.length !== nameB.length) {
                    return nameA.length - nameB.length;
                }
                
                // 4. Korean alphabetical
                return nameA.localeCompare(nameB);
            });
            
            // Limit to top 40 results
            setSearchResults(results.slice(0, 40));
        }, 80);

        return () => clearTimeout(timer);
    }, [searchQuery, isOpen, isLoading]);

    // Add food directly to temporary list and retain focus without unmounting the input
    const handleAddFoodToList = (food: FoodItem, defaultIntake: number = 100) => {
        const ratio = defaultIntake / 100;
        const newFood: SelectedFood = {
            ...food,
            intake: defaultIntake,
            calculatedKcal: food.kcal * ratio,
            calculatedCarbs: food.carbs * ratio,
            calculatedProtein: food.protein * ratio,
            calculatedFat: food.fat * ratio,
        };
        
        setTempList(prev => [...prev, newFood]);
        setSearchQuery('');
        setSearchResults([]);

        // Ensure focus remains on the search input immediately and continuously
        requestAnimationFrame(() => {
            searchInputRef.current?.focus();
        });
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 10);
    };

    // Update intake for an item in tempList
    const handleUpdateIntake = (index: number, newIntake: number) => {
        const intake = Math.max(0, newIntake);
        setTempList(prev => {
            const updated = [...prev];
            const item = updated[index];
            const ratio = intake / 100;
            updated[index] = {
                ...item,
                intake,
                calculatedKcal: item.kcal * ratio,
                calculatedCarbs: item.carbs * ratio,
                calculatedProtein: item.protein * ratio,
                calculatedFat: item.fat * ratio,
            };
            return updated;
        });
    };

    // Remove item from tempList
    const handleRemoveTempItem = (index: number) => {
        setTempList(prev => prev.filter((_, i) => i !== index));
    };

    // Complete selection
    const handleComplete = () => {
        const formattedFoods = tempList.map(f => ({
            foodName: `${f.name} (${f.intake}g)`,
            calories: Math.round(f.calculatedKcal * 10) / 10,
            carbs: Math.round(f.calculatedCarbs * 10) / 10,
            protein: Math.round(f.calculatedProtein * 10) / 10,
            fat: Math.round(f.calculatedFat * 10) / 10
        }));
        onComplete(formattedFoods);
        onClose();
    };

    // Totals in tempList
    const totalTempCalories = tempList.reduce((sum, item) => sum + item.calculatedKcal, 0);
    const totalTempCarbs = tempList.reduce((sum, item) => sum + item.calculatedCarbs, 0);
    const totalTempProtein = tempList.reduce((sum, item) => sum + item.calculatedProtein, 0);
    const totalTempFat = tempList.reduce((sum, item) => sum + item.calculatedFat, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-3 sm:p-4 animate-fadeIn backdrop-blur-xs">
            <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-gray-700 shadow-2xl overflow-hidden">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🔍</span>
                        <div>
                            <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">음식 검색 및 식단 추가</h3>
                            <p className="text-2xs sm:text-xs text-gray-400">음식을 클릭하여 바로 담고 이어서 연속으로 검색할 수 있습니다.</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                        aria-label="닫기"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3.5">
                    
                    {/* Search Input (Permanently mounted to preserve IME state) */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input 
                            ref={searchInputRef}
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="음식 이름을 검색하세요 (예: 닭가슴살, 사과, 쌀밥, 바나나)"
                            className="w-full bg-gray-900/90 border border-gray-600 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    searchInputRef.current?.focus();
                                }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                                title="검색어 지우기"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        )}
                    </div>

                    {/* Database Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-10 bg-gray-900/40 rounded-xl border border-gray-700/50">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
                            <p className="text-sm text-gray-400 font-medium">영양 데이터베이스를 불러오는 중입니다...</p>
                        </div>
                    )}

                    {/* Search Results Dropdown / List */}
                    {searchResults.length > 0 && !isLoading && (
                        <div className="border border-blue-600/40 rounded-xl bg-gray-900/90 shadow-xl overflow-hidden flex flex-col max-h-56 sm:max-h-64">
                            <div className="px-3 py-1.5 bg-blue-950/40 border-b border-blue-900/40 flex justify-between items-center text-2xs text-blue-300 font-medium">
                                <span>검색 결과 ({searchResults.length}건) - 클릭 시 식단 목록에 바로 담깁니다</span>
                                <span>100g 기준</span>
                            </div>
                            <div className="overflow-y-auto divide-y divide-gray-800">
                                {searchResults.map((food, idx) => (
                                    <div 
                                        key={`${food.name}-${idx}`} 
                                        onMouseDown={(e) => {
                                            // Prevents the search input from losing focus / IME reset
                                            e.preventDefault();
                                        }}
                                        onClick={() => handleAddFoodToList(food, 100)}
                                        className="p-2.5 sm:p-3 hover:bg-blue-900/30 cursor-pointer transition-colors flex items-center justify-between gap-2 group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-white group-hover:text-blue-300 transition-colors truncate text-sm">
                                                    {food.name}
                                                </span>
                                                {food.category && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 shrink-0 border border-gray-700">
                                                        {food.category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                <span className="text-orange-400 font-medium">{food.kcal}kcal</span>
                                                <span className="text-gray-600">|</span>
                                                <span>탄 <strong className="text-yellow-400 font-normal">{food.carbs}g</strong></span>
                                                <span>단 <strong className="text-green-400 font-normal">{food.protein}g</strong></span>
                                                <span>지 <strong className="text-red-400 font-normal">{food.fat}g</strong></span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddFoodToList(food, 100);
                                            }}
                                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                            담기
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* No search results feedback */}
                    {searchQuery.trim() && searchResults.length === 0 && !isLoading && cachedDatabase && (
                        <div className="text-center py-6 bg-gray-900/30 rounded-xl border border-gray-700/40 text-gray-400 text-sm">
                            <span className="text-xl block mb-1">🧐</span>
                            <span className="text-gray-300 font-medium">&apos;{searchQuery}&apos;</span>에 대한 검색 결과가 없습니다.
                        </div>
                    )}

                    {/* Temporary Added Foods List */}
                    <div className="flex-1 flex flex-col min-h-[140px]">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <span>📋 담은 음식 목록</span>
                                <span className="text-xs px-2 py-0.5 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-full font-semibold">
                                    {tempList.length}개
                                </span>
                            </h4>
                            {tempList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setTempList([])}
                                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    전체 비우기
                                </button>
                            )}
                        </div>

                        {tempList.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700/70 rounded-xl text-gray-500 text-xs sm:text-sm text-center">
                                <span>위 검색창에 음식을 검색하여 클릭하면 이곳에 추가됩니다.</span>
                                <span className="text-gray-600 text-2xs mt-1">섭취량(g)은 추가 후 자유롭게 변경할 수 있습니다.</span>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto space-y-2 max-h-56 sm:max-h-64 pr-1">
                                {tempList.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="bg-gray-900/90 border border-gray-700/80 p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold text-sm truncate">{item.name}</span>
                                                {item.category && (
                                                    <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 shrink-0">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                <span className="text-orange-400 font-semibold">{formatNumber(item.calculatedKcal)}kcal</span>
                                                <span>탄 {formatNumber(item.calculatedCarbs)}g</span>
                                                <span>단 {formatNumber(item.calculatedProtein)}g</span>
                                                <span>지 {formatNumber(item.calculatedFat)}g</span>
                                            </div>
                                        </div>

                                        {/* Intake Amount Stepper & Controls */}
                                        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                                            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateIntake(idx, item.intake - 50)}
                                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold transition-colors"
                                                    title="-50g"
                                                >
                                                    -50
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateIntake(idx, item.intake - 10)}
                                                    className="px-1.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors border-l border-gray-700"
                                                    title="-10g"
                                                >
                                                    -10
                                                </button>
                                                <div className="flex items-center px-1.5 py-0.5">
                                                    <input
                                                        type="number"
                                                        value={item.intake || ''}
                                                        onChange={(e) => handleUpdateIntake(idx, parseFloat(e.target.value) || 0)}
                                                        className="w-12 bg-transparent text-center text-white font-bold text-xs sm:text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <span className="text-2xs text-gray-400 mr-1">g</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateIntake(idx, item.intake + 10)}
                                                    className="px-1.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors border-r border-gray-700"
                                                    title="+10g"
                                                >
                                                    +10
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateIntake(idx, item.intake + 50)}
                                                    className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold transition-colors"
                                                    title="+50g"
                                                >
                                                    +50
                                                </button>
                                            </div>

                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveTempItem(idx)}
                                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                                                title="항목 제거"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Nutrition Summary Bar for Added Foods */}
                        {tempList.length > 0 && (
                            <div className="mt-2.5 p-2.5 bg-gray-900 border border-gray-700/90 rounded-xl flex flex-wrap items-center justify-between text-xs gap-2">
                                <span className="font-bold text-gray-300">합계 영양소</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-orange-400 font-bold">{formatNumber(totalTempCalories)}kcal</span>
                                    <span className="text-yellow-400 font-semibold">탄 {formatNumber(totalTempCarbs)}g</span>
                                    <span className="text-green-400 font-semibold">단 {formatNumber(totalTempProtein)}g</span>
                                    <span className="text-red-400 font-semibold">지 {formatNumber(totalTempFat)}g</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Modal Footer */}
                <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-900 flex justify-between items-center gap-3">
                    <div className="text-xs text-gray-400 hidden sm:block">
                        {tempList.length > 0 ? `총 ${tempList.length}개 음식이 식단에 추가됩니다.` : '음식을 검색하여 담아주세요.'}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            취소
                        </button>
                        <button 
                            type="button"
                            onClick={handleComplete}
                            disabled={tempList.length === 0}
                            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md ${
                                tempList.length > 0 
                                    ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer active:scale-95' 
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            식단 기록 완료 {tempList.length > 0 && `(${tempList.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
