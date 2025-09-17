import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          setError('알림을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('서버와 통신 중 오류가 발생했습니다.');
      }
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}년 전`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}달 전`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}일 전`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}시간 전`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}분 전`;
    return `${Math.floor(seconds)}초 전`;
  };

  if (loading) {
    return <div>알림을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">알림 내역</h2>
      {notifications.length === 0 ? (
        <div className="text-center py-10">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">새로운 알림이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">새로운 청약 정보가 있으면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map(notif => (
            <li key={notif.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{notif.message}</p>
                {!notif.is_read && <span className="bg-blue-500 w-2 h-2 rounded-full flex-shrink-0 mt-1 ml-2"></span>}
              </div>
              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>{formatTimeAgo(notif.created_at)}</span>
                {notif.url && notif.url !== '#' && (
                  <a href={notif.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    공고 보기
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationScreen;
