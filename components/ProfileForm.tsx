import React, { useState } from 'react';
import { PlayerProfile, DietGoal } from '../types';
import { POSITIONS, DIET_GOALS } from '../constants';
import { formatNumber } from '../utils';

interface ProfileFormProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
  goal: DietGoal;
  setGoal: React.Dispatch<React.SetStateAction<DietGoal>>;
  currentWeight: number | null;
  currentMuscleMass: number | null;
  currentBodyFat: number | null;
  showNotification: (message: string) => void;
  isReadOnly?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, setProfile, goal, setGoal, currentWeight, currentMuscleMass, currentBodyFat, showNotification, isReadOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGoal({ primaryGoal: e.target.value as DietGoal['primaryGoal'] });
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      showNotification('저장이 완료되었습니다.');
    }
    setIsEditing(!isEditing);
  };

  const inputClasses = "mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed";

  const isDisabled = isReadOnly || !isEditing;

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-blue-400">개인 프로필</h2>
        {!isReadOnly && (
            <button
              onClick={handleToggleEdit}
              className={`font-bold py-2 px-4 sm:px-6 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isEditing ? '저장' : '수정'}
            </button>
        )}
      </div>
      <div className="space-y-4">
        {/* Input fields */}
        <div>
            <label className="block text-sm font-medium text-gray-300">선수 이름</label>
            <input type="text" name="name" value={profile.name || ''} onChange={handleChange} disabled={isEditing ? false : true} className={inputClasses}/>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-300">생년월일</label>
          <input type="date" name="dateOfBirth" value={profile.dateOfBirth || ''} onChange={handleChange} disabled={isDisabled} className={inputClasses}/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">키 (cm)</label>
          <input type="number" name="height" value={profile.height || ''} onChange={handleChange} disabled={isDisabled} className={inputClasses}/>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-medium text-gray-300">시작 몸무게 (kg)</label>
            <input type="number" name="weight" value={profile.weight || ''} onChange={handleChange} disabled={isDisabled} className={inputClasses}/>
          </div>
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-medium text-gray-300">현재 몸무게 (kg)</label>
            <input type="text" name="currentWeight" value={currentWeight !== null ? formatNumber(currentWeight) : '기록 없음'} disabled className={inputClasses}/>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-medium text-gray-300">시작 골격근량 (kg)</label>
            <input type="number" name="muscleMass" value={profile.muscleMass || ''} onChange={handleChange} disabled={isDisabled} className={inputClasses}/>
          </div>
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-medium text-gray-300">현재 골격근량 (kg)</label>
            <input type="text" name="currentMuscleMass" value={currentMuscleMass !== null ? formatNumber(currentMuscleMass) : '기록 없음'} disabled className={inputClasses}/>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-medium text-gray-300">시작 체지방률 (%)</label>
            <input type="number" name="bodyFatPercentage" value={profile.bodyFatPercentage || ''} onChange={handleChange} disabled={isDisabled} className={inputClasses}/>
          </div>
          <div className="w-full sm:w-1/2">
            <label className="block text-sm font-medium text-gray-300">현재 체지방률 (%)</label>
            <input type="text" name="currentBodyFat" value={currentBodyFat !== null ? formatNumber(currentBodyFat) : '기록 없음'} disabled className={inputClasses}/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">포지션</label>
          <select name="position" value={profile.position || ''} onChange={handleChange} disabled={isDisabled} className={inputClasses}>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">식단 목표</label>
          <select name="primaryGoal" value={goal.primaryGoal || ''} onChange={handleGoalChange} disabled={isDisabled} className={inputClasses}>
            {DIET_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-300">알러지 정보</label>
          <textarea name="allergies" value={profile.allergies || ''} onChange={handleChange} rows={2} disabled={isDisabled} className={inputClasses}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">선호 음식</label>
            <textarea name="preferences" value={profile.preferences || ''} onChange={handleChange} rows={3} disabled={isDisabled} className={inputClasses}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300">기피 음식</label>
            <textarea name="dislikes" value={profile.dislikes || ''} onChange={handleChange} rows={3} disabled={isDisabled} className={inputClasses}/>
          </div>
        </div>
      </div>
      {isEditing && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleToggleEdit}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 text-lg rounded-lg transition-colors"
          >
            프로필 저장
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileForm;