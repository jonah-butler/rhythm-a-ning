import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RootLayout from './layouts/RootLayout';
import Account from './pages/Account';
import Features from './pages/Features';
import Home from './pages/Home';
import Login from './pages/Login';
import Metronome from './pages/Metronome';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import RhythmBuilder from './pages/RhythmBuilder';
import VerifyAccount from './pages/VerifyAccount';
import VerifyResetPassword from './pages/VerifyResetPassword';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/metronome" element={<Metronome />} />
        <Route path="/builder" element={<RhythmBuilder />} />
        <Route path="/register" element={<Register />} />
        <Route path="/features" element={<Features />} />
        <Route path="/verify-account" element={<VerifyAccount />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route
          path="/verify-reset-password"
          element={<VerifyResetPassword />}
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<Account />} />
        </Route>
      </Route>
    </Routes>
  );
}
