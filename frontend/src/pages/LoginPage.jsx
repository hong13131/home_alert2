import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // 로그인 성공 시 홈으로 이동
        window.location.href = '/';
      } else {
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="username">사용자 이름</label>
            <input
              type="text"
              id="username"
              className="w-full px-3 py-2 border rounded-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="d-grid">
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
              로그인
            </button>
          </div>
          <div className="my-3 text-center text-gray-500">또는</div>
          <div className="d-grid">
            <a href="http://localhost:5001/api/kakao/login" className="w-full bg-[#FEE500] text-[#000000] py-2 rounded-lg hover:bg-yellow-400 text-center flex items-center justify-center font-medium">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 32 32"><path d="M16 4.64c-6.96 0-12.64 4.48-12.64 10.08 0 3.52 2.32 6.64 5.76 8.48l-2.08 7.52 7.84-4.16c1.04.16 2.08.24 3.12.24 6.96 0 12.64-4.48 12.64-10.08S22.96 4.64 16 4.64z"></path></svg>
              카카오로 로그인
            </a>
          </div>
        </form>
        <p className="text-center mt-4">
          계정이 없으신가요? <a href="/register" className="text-blue-500 hover:underline">회원가입</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
