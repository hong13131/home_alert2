import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const KakaoRegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // URL 쿼리 파라미터에서 닉네임 제안을 가져옴
    const nickname = searchParams.get('nickname');
    if (nickname) {
      setUsername(nickname);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/kakao/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (response.ok) {
        // 성공 시 홈으로 이동
        window.location.href = '/';
      } else {
        setError(data.message || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">회원가입 마무리</h2>
        <p className="text-center text-gray-600 mb-4">사용하실 사용자 이름을 확인해주세요.</p>
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
          <div className="d-grid">
            <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
              가입 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KakaoRegisterPage;
