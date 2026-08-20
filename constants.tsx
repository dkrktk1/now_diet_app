import React from 'react';
import { PlayerProfile, DietGoal, DailyDiet } from './types';

export const POSITIONS: PlayerProfile['position'][] = ['투수', '포수', '내야수', '외야수'];
export const DIET_GOALS: DietGoal['primaryGoal'][] = ['체중 증가', '근력 향상', '체지방 감소', '유지'];

export const initialProfile: PlayerProfile = {
    name: '홍길동',
    dateOfBirth: '2000-01-01',
    startDate: new Date().toISOString().split('T')[0],
    height: '185',
    weight: '90',
    muscleMass: '40',
    bodyFatPercentage: '15',
    position: '외야수',
    allergies: '없음',
    preferences: '닭가슴살, 고구마, 브로콜리, 현미',
    dislikes: '매운 음식, 올리브'
};

export const initialGoal: DietGoal = {
    primaryGoal: '근력 향상'
};

export const initialDietPlan: DailyDiet = {
    totalCalories: 0,
    totalMacros: { protein: 0, carbs: 0, fat: 0 },
    meals: [
        {
            name: '식사1',
            time: '',
            menu: [],
            calories: 0,
            macros: { protein: 0, carbs: 0, fat: 0 },
        },
        {
            name: '식사2',
            time: '',
            menu: [],
            calories: 0,
            macros: { protein: 0, carbs: 0, fat: 0 },
        },
        {
            name: '식사3',
            time: '',
            menu: [],
            calories: 0,
            macros: { protein: 0, carbs: 0, fat: 0 },
        }
    ]
};