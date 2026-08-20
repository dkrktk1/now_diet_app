export interface PlayerProfile {
  name: string;
  dateOfBirth: string;
  startDate?: string;
  height: string;
  weight: string;
  muscleMass: string;
  bodyFatPercentage: string;
  position: '투수' | '포수' | '내야수' | '외야수' | '';
  allergies: string;
  preferences: string;
  dislikes: string;
}

export interface DietGoal {
  primaryGoal: '체중 증가' | '근력 향상' | '체지방 감소' | '유지' | '';
}

export interface Macronutrients {
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  name: string;
  time?: string;
  menu: any[];
  calories: number;
  macros: Macronutrients;
}

export interface DailyDiet {
  totalCalories: number;
  totalMacros: Macronutrients;
  meals: Meal[];
}

export interface WeightEntry {
  date: string;
  weight: number;
  muscleMass?: number;
  bodyFat?: number;
}