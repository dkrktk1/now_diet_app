import React, { useState } from 'react';
import { PlayerProfile, DietGoal } from '../types';
import { POSITIONS, DIET_GOALS } from '../constants';

interface SignUpPageProps {
  onSignUp: (username: string, password: string, profile: PlayerProfile, goal: DietGoal) => Promise<void>;
  onNavigateToLogin: () => void;
}

const initialSignUpProfile: PlayerProfile = {
  name: '',
  dateOfBirth: '',
  height: '',
  weight: '',
  bodyFatPercentage: '',
  position: '', // Default to empty to show placeholder
  allergies: '',
  preferences: '',
  dislikes: '',
};

const initialSignUpGoal: DietGoal = {
  primaryGoal: '', // Default to empty to show placeholder
};

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onNavigateToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profile, setProfile] = useState<PlayerProfile>(initialSignUpProfile);
  const [goal, setGoal] = useState<DietGoal>(initialSignUpGoal);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value as any }));
  };
  
  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGoal({ primaryGoal: e.target.value as DietGoal['primaryGoal'] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !profile.name || !profile.height || !profile.weight || !profile.position || !goal.primaryGoal || !profile.dateOfBirth) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await onSignUp(username, password, profile, goal);
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-white";
  const requiredLabel = <span className="text-red-500">*</span>;

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">선수 프로필 등록</h1>
            <p className="text-gray-400 mt-2">계정을 생성하고 맞춤 식단을 시작하세요.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Info */}
            <fieldset className="p-4 border border-gray-700 rounded-md">
                <legend className="px-2 text-lg font-semibold text-blue-400">계정 정보</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">아이디 {requiredLabel}</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">선수 이름 {requiredLabel}</label>
                        <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">비밀번호 {requiredLabel}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">비밀번호 확인 {requiredLabel}</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClasses} required />
                    </div>
                </div>
            </fieldset>

            {/* Profile Info */}
            <fieldset className="p-4 border border-gray-700 rounded-md">
                <legend className="px-2 text-lg font-semibold text-blue-400">신체 정보</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">생년월일 {requiredLabel}</label>
                        <input type="date" name="dateOfBirth" value={profile.dateOfBirth} onChange={handleProfileChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">키 (cm) {requiredLabel}</label>
                        <input type="number" name="height" value={profile.height} onChange={handleProfileChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">몸무게 (kg) {requiredLabel}</label>
                        <input type="number" name="weight" value={profile.weight} onChange={handleProfileChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">체지방률 (%)</label>
                        <input type="number" name="bodyFatPercentage" value={profile.bodyFatPercentage} onChange={handleProfileChange} className={inputClasses} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">포지션 {requiredLabel}</label>
                        <select name="position" value={profile.position} onChange={handleProfileChange} className={inputClasses} required>
                            <option value="" disabled>선택</option>
                            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </fieldset>

             {/* Diet Info */}
            <fieldset className="p-4 border border-gray-700 rounded-md">
                <legend className="px-2 text-lg font-semibold text-blue-400">식단 정보</legend>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">식단 목표 {requiredLabel}</label>
                    <select name="primaryGoal" value={goal.primaryGoal} onChange={handleGoalChange} className={inputClasses} required>
                        <option value="" disabled>선택</option>
                        {DIET_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mt-4">알러지 정보</label>
                    <textarea name="allergies" value={profile.allergies} onChange={handleProfileChange} rows={2} className={inputClasses} placeholder="예: 견과류, 갑각류"/>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">선호 음식</label>
                        <textarea name="preferences" value={profile.preferences} onChange={handleProfileChange} rows={3} className={inputClasses} placeholder="예: 닭가슴살, 고구마"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">기피 음식</label>
                        <textarea name="dislikes" value={profile.dislikes} onChange={handleProfileChange} rows={3} className={inputClasses} placeholder="예: 매운 음식, 올리브"/>
                    </div>
                </div>
            </fieldset>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-base sm:text-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isLoading ? '등록 중...' : '회원가입'}
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={onNavigateToLogin}
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;