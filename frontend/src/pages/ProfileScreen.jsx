import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: "",
    address: "",
    email: "",
    telegram_chat_id: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const response = await fetch(`${apiBase}/api/profile`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBase}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          address: profile.address,
          email: profile.email,
          telegram_chat_id: profile.telegram_chat_id,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("프로필이 성공적으로 업데이트되었습니다.");
      } else {
        setMessage(data.message || "업데이트에 실패했습니다.");
      }
    } catch (err) {
      setMessage("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      await fetch(`${apiBase}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">프로필 관리</h3>
        {message && (
          <p className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2">사용자 이름</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg bg-gray-100"
              value={profile.username}
              disabled
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2" htmlFor="email">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-3 py-2 border rounded-lg"
              value={profile.email || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-600 mb-2"
              htmlFor="telegram_chat_id"
            >
              텔레그램 Chat ID
            </label>
            <input
              type="text"
              id="telegram_chat_id"
              name="telegram_chat_id"
              className="w-full px-3 py-2 border rounded-lg"
              value={profile.telegram_chat_id || ""}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-600 mb-2" htmlFor="address">
              거주지역
            </label>
            <select
              id="address"
              name="address"
              className="w-full px-3 py-2 border rounded-lg"
              value={profile.address || ""}
              onChange={handleChange}
            >
              <option value="">지역 선택</option>
              <option value="전국">전국</option>
              <option value="서울">서울특별시</option>
              <option value="경기">경기도</option>
              <option value="인천">인천광역시</option>
              <option value="부산">부산광역시</option>
              <option value="대구">대구광역시</option>
              <option value="광주">광주광역시</option>
              <option value="대전">대전광역시</option>
              <option value="울산">울산광역시</option>
              <option value="세종">세종특별자치시</option>
              <option value="강원">강원도</option>
              <option value="충북">충청북도</option>
              <option value="충남">충청남도</option>
              <option value="전북">전라북도</option>
              <option value="전남">전라남도</option>
              <option value="경북">경상북도</option>
              <option value="경남">경상남도</option>
              <option value="제주">제주특별자치도</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            저장하기
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
