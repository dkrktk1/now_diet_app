// FIX: Changed to Firebase v8 namespaced API to resolve module export error.
// FIX: Switched to firebase/compat/app to use the v8 namespaced API with Firebase v9+.
import firebase from "firebase/compat/app";
import "firebase/compat/database";
import { PlayerProfile, DietGoal, DailyDiet, WeightEntry } from '../types';

// User-provided Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA1B-ZQBBAvhkXSKcaiE_xkd80ZoIAmb5I",
    authDomain: "diet-management-c9518.firebaseapp.com",
    projectId: "diet-management-c9518",
    storageBucket: "diet-management-c9518.firebasestorage.app",
    messagingSenderId: "794207387881",
    appId: "1:794207387881:web:24f96fad57574471187078",
    databaseURL: "https://diet-management-c9518-default-rtdb.firebaseio.com/",
    measurementId: "G-Y5X2XQHCWY"
};

// Initialize Firebase
// FIX: Switched to v8 initialization syntax.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Helper function to get data
// FIX: Switched to v8 database syntax.
const getData = async (path: string) => {
    const snapshot = await db.ref(path).get();
    if (snapshot.exists()) {
        return snapshot.val();
    }
    return null;
};

// New function to load all users (players) for the admin
// FIX: Switched to v8 database syntax.
export const loadAllUsers = async (): Promise<{ id: string, name: string, dateOfBirth: string, password?: string }[]> => {
    try {
        const usersSnapshot = await db.ref('users').get();
        if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();
            const usersList = Object.keys(usersData).map(userId => ({
                id: userId,
                name: usersData[userId]?.profile?.name || '이름 없음',
                dateOfBirth: usersData[userId]?.profile?.dateOfBirth || '정보 없음',
                password: usersData[userId]?.password || '정보 없음'
            }));
            // Filter out the admin user to get a list of players
            return usersList.filter(user => user.id !== 'admin');
        }
        return [];
    } catch (error) {
        console.error("Error loading all users:", error);
        return [];
    }
};

// --- Profile ---
// FIX: Switched to v8 database syntax.
export const savePlayerProfile = async (userId: string, profile: PlayerProfile) => {
    await db.ref(`users/${userId}/profile`).set(profile);
};
export const loadPlayerProfile = (userId: string): Promise<PlayerProfile | null> => {
    return getData(`users/${userId}/profile`);
};

// --- Goal ---
// FIX: Switched to v8 database syntax.
export const saveDietGoal = async (userId: string, goal: DietGoal) => {
    await db.ref(`users/${userId}/goal`).set(goal);
};
export const loadDietGoal = (userId: string): Promise<DietGoal | null> => {
    return getData(`users/${userId}/goal`);
};

// --- Password ---
export const saveUserPassword = async (userId: string, password: string) => {
    await db.ref(`users/${userId}/password`).set(password);
};

export const loadUserPassword = (userId: string): Promise<string | null> => {
    return getData(`users/${userId}/password`);
};

// --- Global Announcement ---
export const saveGlobalAnnouncement = async (announcement: string) => {
    await db.ref(`global/announcement`).set(announcement);
};

export const loadGlobalAnnouncement = (): Promise<string | null> => {
    return getData(`global/announcement`);
};

// --- Diets (User and Admin) ---
// FIX: Switched to v8 database syntax.
export const saveUserDiets = async (userId: string, diets: { [key: string]: DailyDiet }) => {
    await db.ref(`users/${userId}/userDiets`).set(diets);
};

// FIX: Switched to v8 database syntax.
export const saveAdminDiets = async (userId: string, diets: { [key: string]: DailyDiet }) => {
    await db.ref(`users/${userId}/adminDiets`).set(diets);
};

export const loadUserDiets = (userId: string): Promise<{ [key: string]: DailyDiet } | null> => {
    return getData(`users/${userId}/userDiets`);
};

export const loadAdminDiets = (userId: string): Promise<{ [key: string]: DailyDiet } | null> => {
    return getData(`users/${userId}/adminDiets`);
};


// --- Weight History ---
// FIX: Switched to v8 database syntax.
export const saveWeightHistory = async (userId: string, history: WeightEntry[]) => {
    await db.ref(`users/${userId}/weightHistory`).set(history);
};
export const loadWeightHistory = (userId: string): Promise<WeightEntry[] | null> => {
    return getData(`users/${userId}/weightHistory`);
};

// --- Frequent Foods ---
export const saveFrequentFoods = async (userId: string, foods: any[]) => {
    await db.ref(`users/${userId}/frequentFoods`).set(foods);
};
export const loadFrequentFoods = (userId: string): Promise<any[] | null> => {
    return getData(`users/${userId}/frequentFoods`);
};