import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { DateProvider } from './features/date/DateContext'; // Importe o Contexto de Data
import { Toaster } from 'sonner';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import FixedExpensesPage from './pages/FixedExpensesPage';
import CardsPage from './pages/CardsPage'; // Se tiver criado a página de cartões

// Componente de Rota Privada
const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DateProvider> {/* O DateProvider deve envolver as rotas */}
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rotas Protegidas */}
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
            <Route path="/fixed-expenses" element={<PrivateRoute><FixedExpensesPage /></PrivateRoute>} />
            <Route path="/cards" element={<PrivateRoute><CardsPage /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </DateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}