import { Route, Routes } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Features from './pages/Features';
import Home from './pages/Home';
import Metronome from './pages/Metronome';
import Register from './pages/Register';
import RhythmBuilder from './pages/RhythmBuilder';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/metronome" element={<Metronome />} />
        <Route path="/builder" element={<RhythmBuilder />} />
        <Route path="/register" element={<Register />} />
        <Route path="/features" element={<Features />} />
      </Route>
    </Routes>
  );
}
