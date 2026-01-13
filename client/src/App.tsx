import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import OtpPage from "./components/OtpPage";
import TodayPage from "./components/TodayPage";
import UpcomingPage from "./components/UpcomingPage";
import CompletedPage from "./components/CompletedPage";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* default ke halaman login */}
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* Auth */}
        <Route path="/signin" element={<AuthLayout mode="signin" />} />
        <Route path="/signup" element={<AuthLayout mode="signup" />} />
        <Route path="/otp" element={<OtpPage />} />

        {/* Layout utama dengan sidebar */}
        <Route element={<MainLayout />}>
          <Route path="/today" element={<TodayPage />} />
          <Route path="/upcoming" element={<UpcomingPage />} />
          <Route path="/completed" element={<CompletedPage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
