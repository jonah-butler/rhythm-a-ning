import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <BrowserRouter basename="/rhythm-a-ning"> */}
    <BrowserRouter>
      <App />
      <ToastContainer theme="dark" progressClassName="bg-pink-purple" />
    </BrowserRouter>
  </StrictMode>,
);
