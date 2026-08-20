import React, { useState, useEffect } from 'react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onNavigateToSignUp: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigateToSignUp }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.trim() === '' || password.trim() === '') {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    try {
        await onLogin(username, password);
    } catch (err: any) {
        setError(err.message || '로그인에 실패했습니다.');
    }
  };

  useEffect(() => {
      const storedUsername = localStorage.getItem('rememberedUsername');
      if (storedUsername) {
          setUsername(storedUsername);
          setRememberMe(true);
      }
  }, []);

  useEffect(() => {
      if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
      } else {
          localStorage.removeItem('rememberedUsername');
      }
  }, [rememberMe, username]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl">
        {/* Login Form */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
           <div className="text-center mb-8">
             <h1 className="text-2xl sm:text-3xl font-bold text-white">나우아이원 선수 식단 관리</h1>
             <p className="text-gray-400 mt-2">로그인하여 맞춤 식단을 확인하세요.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300">아이디</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="nowiwon"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 text-white"
                placeholder="********"
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
              />
              <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-300">
                아이디 저장
              </label>
            </div>
            {error && <p className="text-red-500 text-sm text-center -mt-2">{error}</p>}
            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors text-base sm:text-lg"
              >
                로그인
              </button>
            </div>
          </form>
           <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              계정이 없으신가요?{' '}
              <button
                onClick={onNavigateToSignUp}
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                회원가입
              </button>
            </p>
          </div>
           <p className="text-center text-xs text-gray-500 mt-8">
              &copy; 2026. 나우아이원매니지먼트그룹. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;