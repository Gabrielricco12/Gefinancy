import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = () => {
  const { user } = useAuth();

  // Se não tem usuário, manda pro login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se tem usuário, renderiza o conteúdo da rota filha
  return <Outlet />;
};