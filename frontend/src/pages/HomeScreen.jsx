import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import ApartmentCard from '../components/ApartmentCard';

const HomeScreen = () => {
  const [userData, setUserData] = useState(null);
  const [apartments, setApartments] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionRes = await fetch('/api/session_check');
        const sessionData = await sessionRes.json();
        
        if (sessionData.is_logged_in) {
          setIsLoggedIn(true);
          
          // 프로필 정보 가져오기
          const profileRes = await fetch('/api/profile');
          const profileData = await profileRes.json();
          
          setUserData({
            name: sessionData.user.username,
            region: profileData.address, // 실제 주소 정보 사용
            favoriteCount: 0, // Placeholder
          });

          const recRes = await fetch('/api/recommendations');
          const recData = await recRes.json();
          setApartments(recData);
          setUserData(prev => ({ ...prev, eligibleCount: recData.length }));
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  if (!isLoggedIn || !userData) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold mb-4">청약 알리미에 오신 것을 환영합니다</h2>
        <p className="text-gray-600 mb-6">로그인하고 맞춤형 청약 정보를 받아보세요.</p>
        {/* In a real app, this would be a <Link> from react-router-dom */}
        <a href="/login" className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600">
          로그인
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">{userData.name}님, 환영합니다!</h2>
        {userData.region ? (
          <p className="text-blue-100 mb-4">{userData.region} 지역의 청약 정보를 확인해보세요.</p>
        ) : (
          <p className="text-blue-100 mb-4">프로필에서 관심 지역을 설정하고 맞춤 정보를 받아보세요.</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-2xl font-bold">{userData.eligibleCount}</p>
            <p className="text-sm text-blue-100">신청 가능</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-2xl font-bold">{userData.favoriteCount}</p>
            <p className="text-sm text-blue-100">관심 등록</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          {userData.region ? `${userData.region} 지역 청약 리스트` : '전체 청약 리스트'}
        </h3>
        <div className="space-y-3">
          {apartments.map(apt => (
            <ApartmentCard key={apt.PBLANC_NO} apartment={apt} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
