import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/useAuthContext';
import { Loader } from './Loader/Loader';

export default function ProtectedRoute() {
  const { status } = useAuthContext();
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <Loader />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
