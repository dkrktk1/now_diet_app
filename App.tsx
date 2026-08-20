import React, { useState, useEffect, useCallback } from 'react';
import { PlayerProfile, DietGoal, DailyDiet, WeightEntry } from './types';
import { formatDateDots, parseDateString } from './utils';
import { initialProfile, initialGoal, initialDietPlan } from './constants';
import ProfileForm from './components/ProfileForm';
import DietPlanDisplay from './components/DietPlanDisplay';
import MonthlyCalendar from './components/MonthlyCalendar';
import WeightTracker from './components/WeightTracker';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import DateNavigator from './components/DateNavigator';
import PlayerSelector from './components/PlayerSelector';
import BottomNavBar from './components/BottomNavBar';
import PlayerRoster from './components/PlayerRoster';
import {
    savePlayerProfile, loadPlayerProfile,
    saveDietGoal, loadDietGoal,
    saveAdminDiets, loadAdminDiets,
    saveUserDiets, loadUserDiets,
    saveWeightHistory, loadWeightHistory,
    loadAllUsers,
    saveUserPassword, loadUserPassword,
    saveGlobalAnnouncement, loadGlobalAnnouncement
} from './services/firebaseService';

interface HeaderProps {
    onLogout: () => void;
    userName: string;
    currentDate: string;
}

const Header: React.FC<HeaderProps> = ({ onLogout, userName, currentDate }) => {
    return (
        <header className="bg-gray-800 shadow-lg p-4 mb-6">
            <div className="container mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h1 className="text-center sm:text-left text-xl md:text-2xl font-bold text-white tracking-wider">
                        나우아이원 선수 맞춤 식단
                    </h1>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                        <div className="text-white text-sm">
                            <span className="hidden md:inline">{currentDate} | </span>
                            <span className="font-semibold">{userName}님</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm shrink-0"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
                 <p className="md:hidden text-center text-gray-300 text-xs mt-2">{currentDate}</p>
            </div>
        </header>
    );
};

type Tab = 'profile' | 'diet' | 'adminDiet' | 'calendar' | 'bodyComposition' | 'adminCalendar' | 'adminBodyComposition' | 'playerRoster';
type PlayerTab = 'profile' | 'diet' | 'calendar' | 'bodyComposition';
type UserRole = 'admin' | 'player';

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // YYYY-MM-DD
};

interface Player {
  id: string;
  name: string;
  dateOfBirth: string;
  password?: string;
}

const App: React.FC = () => {
    const [profile, setProfile] = useState<PlayerProfile>(initialProfile);
    const [goal, setGoal] = useState<DietGoal>(initialGoal);
    const [adminDiets, setAdminDiets] = useState<{ [key: string]: DailyDiet }>({});
    const [userDiets, setUserDiets] = useState<{ [key: string]: DailyDiet }>({});
    const [activeTab, setActiveTab] = useState<Tab>('diet');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('userId'));
    const [userRole, setUserRole] = useState<UserRole | null>(() => localStorage.getItem('userRole') as UserRole | null);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [authView, setAuthView] = useState<'login' | 'signup'>('login');
    const [notification, setNotification] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState<string>('');
    const [autoApplyRecentDiet, setAutoApplyRecentDiet] = useState<boolean>(true);

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleTabChange = (tabName: Tab) => {
        if (activeTab !== tabName) {
            setActiveTab(tabName);
            window.history.pushState({ tab: tabName }, '');
        }
    };

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && event.state.tab) {
                setActiveTab(event.state.tab);
            }
        };

        if (userId) {
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [userId]);

    const loadDataForUser = useCallback(async (targetUserId: string) => {
        setIsLoading(true);
        try {
            const [loadedProfile, loadedGoal, loadedAdminDiets, loadedUserDiets, loadedWeightHistory, loadedAnnouncement] = await Promise.all([
                loadPlayerProfile(targetUserId),
                loadDietGoal(targetUserId),
                loadAdminDiets(targetUserId),
                loadUserDiets(targetUserId),
                loadWeightHistory(targetUserId),
                loadGlobalAnnouncement(),
            ]);
            setProfile({ ...initialProfile, ...(loadedProfile || {}) });
            setGoal(loadedGoal || initialGoal);
            setAdminDiets(loadedAdminDiets || {});
            setUserDiets(loadedUserDiets || {});
            setWeightHistory(loadedWeightHistory || []);
            setAnnouncement(loadedAnnouncement || '');
        } catch (error) {
            console.error(`Failed to load data for user ${targetUserId}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    // Admin needs to load player list on initial load if logged in
    useEffect(() => {
        const fetchPlayers = async () => {
            if (userRole === 'admin') {
                setIsLoading(true);
                const players = await loadAllUsers();
                setAllPlayers(players);
                if (players.length > 0) {
                    const defaultPlayer = players.find(p => p.name === '손성빈');
                    setSelectedPlayerId(defaultPlayer ? defaultPlayer.id : players[0].id);
                } else {
                    setIsLoading(false);
                }
            }
        };
        fetchPlayers();
    }, [userRole]);


    // Load data based on role and selection
    useEffect(() => {
        if (userRole === 'player' && userId) {
            loadDataForUser(userId);
        } else if (userRole === 'admin' && selectedPlayerId) {
            loadDataForUser(selectedPlayerId);
        } else if (!userId) {
            setIsLoading(false);
        }
    }, [userId, userRole, selectedPlayerId, loadDataForUser]);

    // Data Saving Logic
    useEffect(() => {
        if (isLoading || !userId) return;
        const idToSaveFor = userRole === 'admin' ? selectedPlayerId : userId;
        if (!idToSaveFor) return;
        savePlayerProfile(idToSaveFor, profile);
        saveDietGoal(idToSaveFor, goal);
        
        // If admin changed the player's name, update the dropdown list
        if (userRole === 'admin' && selectedPlayerId && allPlayers.find(p => p.id === selectedPlayerId)?.name !== profile.name) {
             setAllPlayers(prevPlayers => prevPlayers.map(p => 
                p.id === selectedPlayerId ? { ...p, name: profile.name } : p
            ));
        }
    }, [profile, goal, isLoading, userId, userRole, selectedPlayerId, allPlayers]);

    useEffect(() => {
        if (isLoading || !userId || userRole !== 'admin' || !selectedPlayerId) return;
        saveAdminDiets(selectedPlayerId, adminDiets);
    }, [adminDiets, isLoading, userId, userRole, selectedPlayerId]);

    useEffect(() => {
        if (isLoading || !userId) return;
        const idToSaveFor = userRole === 'admin' ? selectedPlayerId : userId;
        if (!idToSaveFor) return;
        saveUserDiets(idToSaveFor, userDiets);
    }, [userDiets, isLoading, userId, userRole, selectedPlayerId]);
    
    useEffect(() => {
        if (isLoading || !userId) return;
        const idToSaveFor = userRole === 'admin' ? selectedPlayerId : userId;
        if (!idToSaveFor) return;
        saveWeightHistory(idToSaveFor, weightHistory);
    }, [weightHistory, isLoading, userId, userRole, selectedPlayerId]);


    useEffect(() => {
        if (isLoading || !userId || userRole !== 'admin') return;
        saveGlobalAnnouncement(announcement);
    }, [announcement, isLoading, userId, userRole]);

    const handleLogin = async (username: string, password: string) => {
        const trimmedUsername = username.trim();

        // Admin login check
        if (trimmedUsername === 'admin') {
            if (password === 'admin123') {
                localStorage.setItem('userId', trimmedUsername);
                localStorage.setItem('userRole', 'admin');
                setUserId(trimmedUsername);
                setUserRole('admin');
                const initialTab: Tab = 'adminDiet';
                setActiveTab(initialTab);
                window.history.replaceState({ tab: initialTab }, '');
                
                // Fetch players immediately on login
                const players = await loadAllUsers();
                setAllPlayers(players);
                if (players.length > 0) {
                    const defaultPlayer = players.find(p => p.name === '손성빈');
                    setSelectedPlayerId(defaultPlayer ? defaultPlayer.id : players[0].id);
                } else {
                    setIsLoading(false);
                }
                return;
            } else {
                throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
            }
        }

        // Player login check
        const userExists = await loadPlayerProfile(trimmedUsername);
        if (!userExists) {
            throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        }

        const storedPassword = await loadUserPassword(trimmedUsername);
        if (storedPassword !== password) {
            throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        
        // Login successful
        localStorage.setItem('userId', trimmedUsername);
        localStorage.setItem('userRole', 'player');
        setUserId(trimmedUsername);
        setUserRole('player');
        const initialTab: Tab = 'diet';
        setActiveTab(initialTab);
        window.history.replaceState({ tab: initialTab }, '');
    };
    
    const handleLogout = () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        setUserId(null);
        setUserRole(null);
        setAuthView('login');
        setProfile(initialProfile);
        setGoal(initialGoal);
        setAdminDiets({});
        setWeightHistory([]);
        setAllPlayers([]);
        setSelectedPlayerId(null);
        setActiveTab('diet');
        window.history.replaceState(null, '', '/');
    };

    const handleSignUp = async (username: string, password: string, profileData: PlayerProfile, goalData: DietGoal) => {
        const trimmedUsername = username.trim();
        if (trimmedUsername === 'admin') {
            throw new Error("'admin'은 아이디로 사용할 수 없습니다.");
        }
        
        const userExists = await loadPlayerProfile(trimmedUsername);
        if (userExists) {
            throw new Error('이미 사용 중인 아이디입니다.');
        }
        
        const allCurrentUsers = await loadAllUsers();
        const nameExists = allCurrentUsers.some(user => user.name.trim().toLowerCase() === profileData.name.trim().toLowerCase());
        if (nameExists) {
            throw new Error('이미 사용 중인 선수 이름입니다.');
        }

        const profileWithDate = {
            ...profileData,
            startDate: profileData.startDate || formatDateDots(new Date())
        };

        await savePlayerProfile(trimmedUsername, profileWithDate);
        await saveDietGoal(trimmedUsername, goalData);
        await saveUserPassword(trimmedUsername, password);
        
        showNotification('회원가입이 완료되었습니다! 로그인해주세요.');
        setAuthView('login');
    };

    const getLatestAdminDiet = useCallback(() => {
        const dates = Object.keys(adminDiets).sort((a, b) => parseDateString(b) - parseDateString(a));
        const currentDateMs = parseDateString(formatDate(selectedDate));
        for (const date of dates) {
            if (adminDiets[date] && adminDiets[date].totalCalories > 0 && parseDateString(date) < currentDateMs) {
                return adminDiets[date];
            }
        }
        return null;
    }, [adminDiets, selectedDate]);

    if (!userId) {
        return authView === 'login' ? (
            <LoginPage onLogin={handleLogin} onNavigateToSignUp={() => setAuthView('signup')} />
        ) : (
            <SignUpPage onSignUp={handleSignUp} onNavigateToLogin={() => setAuthView('login')} />
        );
    }
    
    const currentDateStr = selectedDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });
    
    const sortedHistory = weightHistory.length > 0 ? [...weightHistory].sort((a, b) => parseDateString(a.date) - parseDateString(b.date)) : [];
    const latestEntry = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;
    const currentWeight = latestEntry ? latestEntry.weight : null;
    
    // Find the latest entry that has a valid muscle mass (> 0)
    const latestMuscleEntry = [...sortedHistory].reverse().find(entry => entry.muscleMass && entry.muscleMass > 0);
    const currentMuscleMass = latestMuscleEntry ? latestMuscleEntry.muscleMass : null;

    // Find the latest entry that has a valid body fat (> 0)
    const latestBodyFatEntry = [...sortedHistory].reverse().find(entry => entry.bodyFat && entry.bodyFat > 0);
    const currentBodyFat = latestBodyFatEntry ? latestBodyFatEntry.bodyFat : null;

    let currentAdminDiet = adminDiets[formatDate(selectedDate)];
    if (!currentAdminDiet || currentAdminDiet.totalCalories === 0) {
        if (autoApplyRecentDiet && userRole === 'admin') {
            const latest = getLatestAdminDiet();
            currentAdminDiet = latest ? { ...latest } : initialDietPlan;
        } else {
            currentAdminDiet = initialDietPlan;
        }
    }
    
    const currentUserDiet = userDiets[formatDate(selectedDate)] || initialDietPlan;

    const handleAddBodyComposition = (weight: number, muscleMass: number, bodyFat: number, date: Date) => {
        const dateStr = formatDateDots(date);
        const newEntry: WeightEntry = { date: dateStr, weight: weight, muscleMass, bodyFat };

        const entryIndex = weightHistory.findIndex(entry => entry.date === dateStr);
        let updatedHistory;
        if (entryIndex > -1) {
            updatedHistory = [...weightHistory];
            updatedHistory[entryIndex] = newEntry;
        } else {
            updatedHistory = [...weightHistory, newEntry];
        }

        setWeightHistory(updatedHistory.sort((a, b) => parseDateString(a.date) - parseDateString(b.date)));
    };
    
    const handleDeleteBodyComposition = (date: Date) => {
        const dateStr = formatDateDots(date);
        setWeightHistory(prev => prev.filter(entry => entry.date !== dateStr));
    };
    
    const handleDateSelectedFromCalendar = (date: Date) => {
        setSelectedDate(date);
        handleTabChange(userRole === 'admin' ? 'adminDiet' : 'diet');
    };
    
    const dateStringForWeight = formatDateDots(selectedDate);
    const weightForDate = weightHistory.find(entry => entry.date === dateStringForWeight) || null;

    const renderContent = () => {
        if (userRole === 'admin' && !selectedPlayerId && activeTab !== 'playerRoster') {
            return (
                <div className="text-center py-10">
                    <p className="text-lg text-gray-400">선수를 선택하여 식단을 관리하세요.</p>
                </div>
            );
        }

        switch(activeTab) {
            case 'profile':
                return <ProfileForm 
                    profile={profile} 
                    setProfile={setProfile} 
                    goal={goal} 
                    setGoal={setGoal} 
                    currentWeight={currentWeight} 
                    currentMuscleMass={currentMuscleMass}
                    currentBodyFat={currentBodyFat}
                    showNotification={showNotification} 
                />;
            case 'diet':
            case 'adminDiet':
                return (
                    <>
                        <DateNavigator 
                            selectedDate={selectedDate}
                            onNavigateToCalendar={() => handleTabChange(userRole === 'admin' ? 'adminCalendar' : 'calendar')}
                            onGoToToday={() => setSelectedDate(new Date())}
                            onDateChange={setSelectedDate}
                        />
                        <DietPlanDisplay 
                            adminDiet={currentAdminDiet}
                            userDiet={currentUserDiet}
                            allAdminDiets={adminDiets}
                            allUserDiets={userDiets}
                            setAdminDiet={(updater) => {
                                const newDiet = typeof updater === 'function' ? updater(currentAdminDiet) : updater;
                                setAdminDiets(prev => ({ ...prev, [formatDate(selectedDate)]: newDiet }));
                            }}
                            setUserDiet={(updater) => {
                                const newDiet = typeof updater === 'function' ? updater(currentUserDiet) : updater;
                                setUserDiets(prev => ({ ...prev, [formatDate(selectedDate)]: newDiet }));
                            }}
                            onAddBodyComposition={handleAddBodyComposition}
                            onDeleteBodyComposition={handleDeleteBodyComposition}
                            selectedDate={selectedDate}
                            weightForDate={weightForDate}
                            showSaveButton={userRole === 'admin'}
                            onSave={() => {
                                setAdminDiets(prev => ({ ...prev, [formatDate(selectedDate)]: currentAdminDiet }));
                                setUserDiets(prev => ({ ...prev, [formatDate(selectedDate)]: currentUserDiet }));
                                showNotification("저장이 완료되었습니다.");
                            }}
                            showNotification={showNotification}
                            userRole={userRole}
                            targetUserId={userRole === 'admin' ? selectedPlayerId : userId}
                            playerName={userRole === 'admin' ? (allPlayers.find(p => p.id === selectedPlayerId)?.name || profile.name) : profile.name}
                            announcement={announcement}
                            setAnnouncement={setAnnouncement}
                            autoApplyRecentDiet={autoApplyRecentDiet}
                            setAutoApplyRecentDiet={setAutoApplyRecentDiet}
                        />
                    </>
                );
            case 'calendar':
            case 'adminCalendar':
                return <MonthlyCalendar 
                    onDateClick={handleDateSelectedFromCalendar} 
                    adminDiets={adminDiets} 
                    userDiets={userDiets} 
                    weightHistory={weightHistory} 
                    autoApplyRecentDiet={autoApplyRecentDiet}
                    userRole={userRole}
                />;
            case 'bodyComposition':
            case 'adminBodyComposition':
                return <WeightTracker 
                    history={weightHistory} 
                    startWeight={parseFloat(profile.weight) || null} 
                    startMuscleMass={parseFloat(profile.muscleMass) || null} 
                    startBodyFat={parseFloat(profile.bodyFatPercentage) || null} 
                    startDate={profile.startDate} 
                    userDiets={userDiets} 
                    adminDiets={adminDiets} 
                    onAddBodyComposition={handleAddBodyComposition}
                    onDeleteBodyComposition={handleDeleteBodyComposition}
                    selectedDate={selectedDate}
                    weightForDate={weightForDate}
                    showNotification={showNotification}
                />;
            case 'playerRoster':
                return userRole === 'admin' ? <PlayerRoster players={allPlayers} /> : null;
            default:
                return null;
        }
    };
    
    const footerClasses = `text-center text-xs text-gray-500 py-4 mt-8 ${
        userRole === 'player'
            ? 'relative'
            : 'fixed bottom-0 w-full bg-gray-900 z-50 md:relative'
    }`;

    return (
        <div className="bg-gray-900 text-white min-h-screen pb-20">
             {notification && (
                <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-fade-in-out">
                    {notification}
                </div>
            )}
            <Header onLogout={handleLogout} userName={userRole === 'admin' ? '관리자' : profile.name} currentDate={currentDateStr} />
            <main className="container mx-auto px-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-lg text-gray-400">데이터를 불러오는 중...</p>
                    </div>
                ) : (
                    <>
                        {userRole === 'admin' && (
                            <>
                                <PlayerSelector players={allPlayers} selectedPlayerId={selectedPlayerId} onSelectPlayer={setSelectedPlayerId} />
                                <div className="flex flex-wrap justify-center border-b border-gray-700 mb-6">
                                    <button onClick={() => handleTabChange('profile')} className={`py-3 px-6 text-base font-semibold transition-colors ${activeTab === 'profile' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>프로필</button>
                                    <button onClick={() => handleTabChange('adminDiet')} className={`py-3 px-6 text-base font-semibold transition-colors ${activeTab === 'adminDiet' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>식단 관리</button>
                                    <button onClick={() => handleTabChange('adminCalendar')} className={`py-3 px-6 text-base font-semibold transition-colors ${activeTab === 'adminCalendar' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>식단 캘린더</button>
                                    <button onClick={() => handleTabChange('adminBodyComposition')} className={`py-3 px-6 text-base font-semibold transition-colors ${activeTab === 'adminBodyComposition' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>통계</button>
                                    <button onClick={() => handleTabChange('playerRoster')} className={`py-3 px-6 text-base font-semibold transition-colors ${activeTab === 'playerRoster' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>선수 명단</button>
                                </div>
                            </>
                        )}
                        {renderContent()}
                    </>
                )}
            </main>
            {userRole === 'player' && (
                <BottomNavBar activeTab={activeTab as PlayerTab} onTabChange={(tab) => handleTabChange(tab as Tab)} />
            )}
            <footer className={footerClasses}>
              &copy; 2026. 나우아이원매니지먼트그룹. All rights reserved.
            </footer>
        </div>
    );
};

export default App;