import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { DateProvider } from './features/date/DateContext';
import { Toaster } from 'sonner';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';     // Lista de todas as contas
import AccountDashboard from './pages/AccountDashboard';     // <--- RECUPERADO: Detalhes de uma conta específica
import FixedExpensesPage from './pages/FixedExpensesPage';
import CardsPage from './pages/CardsPage'; 

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
        <DateProvider>
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rotas Protegidas */}
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            
            {/* Página que lista todas as contas e cartões */}
            <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
            
            {/* <--- ROTA RECUPERADA: Detalhes de uma conta específica (Ex: Nubank) */}
            <Route path="/accounts/:id" element={<PrivateRoute><AccountDashboard /></PrivateRoute>} />
            
            <Route path="/fixed-expenses" element={<PrivateRoute><FixedExpensesPage /></PrivateRoute>} />
            <Route path="/cards" element={<PrivateRoute><CardsPage /></PrivateRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </DateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
