import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import { Settings } from "lucide-react";

import BottomNav from "./components/BottomNav";
import HomeScreen from "./pages/HomeScreen";
import CalendarScreen from "./pages/CalendarScreen";
import NotificationScreen from "./pages/NotificationScreen";
import ProfileScreen from "./pages/ProfileScreen";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import KakaoRegisterPage from "./pages/KakaoRegisterPage";
import UrgentSalesPage from "./pages/UrgentSalesPage";

// 로그인해야만 접근 가능한 페이지들을 위한 보호막
const ProtectedRoute = ({ isLoggedIn }) => {
  if (isLoggedIn === null) return <div>Loading...</div>; // 세션 확인 중
  return isLoggedIn ? <AppLayout /> : <Navigate to="/login" />;
};

// 로그인하지 않은 사용자만 접근 가능한 페이지들을 위한 보호막
const PublicRoute = ({ isLoggedIn }) => {
  if (isLoggedIn === null) return <div>Loading...</div>;
  return !isLoggedIn ? <Outlet /> : <Navigate to="/" />;
};

const AppLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4 flex justify-between items-center max-w-md mx-auto">
        <h1 className="text-xl font-bold text-gray-900">청약 알리미</h1>
        <Settings className="w-6 h-6 text-gray-600" />
      </div>
    </header>
    <main className="px-4 py-6 pb-24 max-w-md mx-auto">
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || "";
        const response = await fetch(`${apiBase}/api/session_check`, {
          credentials: "include",
        });
        const data = await response.json();
        setIsLoggedIn(data.is_logged_in);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="calendar" element={<CalendarScreen />} />
          <Route path="notifications" element={<NotificationScreen />} />
          <Route path="profile" element={<ProfileScreen />} />
          <Route path="urgent-sales" element={<UrgentSalesPage />} />
        </Route>
        <Route element={<PublicRoute isLoggedIn={isLoggedIn} />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/kakao" element={<KakaoRegisterPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
