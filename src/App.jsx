import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';

// Páginas Principais
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage'; // Sua Home/Dashboard Geral
import FixedExpensesPage from './pages/FixedExpensesPage';
import TransactionsPage from './pages/TransactionsPage'; 

// --- NOVAS PÁGINAS (Features Específicas) ---
// Certifique-se que o caminho está correto conforme sua estrutura de pastas
import AccountDashboard from './features/accounts/pages/AccountDashboard';
import CardInvoicePage from './features/cards/pages/CardInvoicePage';

function App() {
  return (
    <BrowserRouter>
      {/* Sistema de Notificações (Toasts) */}
      <Toaster 
        position="top-center" 
        richColors 
        toastOptions={{
          classNames: {
            toast: 'bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl rounded-2xl text-gray-800',
            title: 'font-bold text-base',
            description: 'text-gray-500 text-sm',
            actionButton: 'bg-blue-600',
            cancelButton: 'bg-gray-200',
          },
        }}
      />

      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rotas Protegidas (Requer Login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            
            {/* --- NOVAS ROTAS DINÂMICAS --- */}
            {/* O :id permite pegar o UUID da conta/cartão na URL */}
            <Route path="/accounts/:id" element={<AccountDashboard />} />
            <Route path="/cards/:id" element={<CardInvoicePage />} />

            <Route path="/profile" element={<div>Perfil (Em breve)</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;