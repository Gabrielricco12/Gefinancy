import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useDate } from '../features/date/DateContext'; // Hook Global de Data
import MainLayout from '../components/layout/MainLayout';
import ExpenseForm from '../components/transactions/ExpenseForm';
import IncomeForm from '../components/transactions/IncomeForm';
import { getStatement } from '../features/transactions/transactions.service';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDateRelative } from '../lib/formatters';
import { toast } from 'sonner';
import { 
  LogOut, Eye, EyeOff, ArrowDown, ArrowUp, 
  ShoppingCart, Utensils, Car, Music, ShoppingBag, Loader2,
  Plus, ArrowUpCircle, ArrowDownCircle, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth } from 'date-fns';

// Helpers visuais simples
const getIconByCategory = (slug) => <ShoppingCart size={20} className="text-white" />;
const getColorByCategory = (slug) => 'bg-blue-500';
const modalVariants = { hidden: { y: "100%", opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }, exit: { y: "100%", opacity: 0, transition: { ease: "easeInOut", duration: 0.2 } } };

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { currentDate } = useDate(); // Consome a data global (controlada pelo Layout)
  
  // UI States
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Data
  const [statement, setStatement] = useState([]);
  const [metrics, setMetrics] = useState({
    totalBalance: 0, 
    monthIncome: 0,
    monthExpense: 0
  });
  
  const firstName = user?.user_metadata?.first_name || 'Usuário';

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      
      // 1. Buscar Extrato do Mês Selecionado (Global)
      const monthlyData = await getStatement(user.id, start, end);
      setStatement(monthlyData);

      // Calcular Fluxo do Mês
      let mIncome = 0;
      let mExpense = 0;
      monthlyData.forEach(item => {
        const val = Number(item.amount);
        if (item.type === 'income') mIncome += val; 
        else mExpense += val; // Expenses + Fixed Projected
      });

      // 2. CALCULAR SALDO TOTAL REAL (Histórico Completo)
      // Lógica: Saldo Inicial das Contas + Todas as Receitas - Todas as Despesas (pagas ou pendentes se for cartão)
      
      const [accRes, incRes, expRes] = await Promise.all([
        supabase.from('accounts').select('initial_balance'),
        supabase.from('incomes').select('amount'),
        supabase.from('expenses').select('total_amount')
      ]);

      const totalInitial = accRes.data?.reduce((acc, curr) => acc + Number(curr.initial_balance || 0), 0) || 0;
      const totalIncomes = incRes.data?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;
      const totalExpenses = expRes.data?.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0) || 0;

      const calculatedBalance = totalInitial + totalIncomes - totalExpenses;

      setMetrics({
        totalBalance: calculatedBalance,
        monthIncome: mIncome,
        monthExpense: mExpense
      });

    } catch (error) {
      console.error("Erro dashboard:", error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  // Recarrega sempre que o usuário mudar (login) ou a data global mudar (swipe)
  useEffect(() => { loadData(); }, [user, currentDate]);

  const handleSuccess = () => {
    toast.success("Salvo com sucesso!");
    setActiveModal(null);
    loadData();
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <MainLayout>
      {/* Header Interno - A navegação de data agora está no MainLayout, aqui fica só saudação */}
      <div className="px-6 pb-2 pt-2 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Olá, {firstName}</h1>
        <button onClick={handleLogout} className="p-2 bg-white rounded-full shadow-sm text-red-500 border border-red-100 hover:bg-red-50 transition">
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex-1 px-6 space-y-6 mt-2 pb-24"> 
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <>
            {/* Card Saldo Global */}
            <div className="w-full bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
               <div className="flex justify-between items-start mb-2">
                <span className="text-blue-50 font-medium text-sm flex items-center gap-1">
                   <Wallet size={16} /> Saldo Geral
                </span>
                <button onClick={() => setShowBalance(!showBalance)} className="text-blue-100 hover:text-white transition">
                  {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {showBalance ? formatCurrency(metrics.totalBalance) : '••••••'}
              </div>
              <div className="mt-2 text-xs text-blue-100 opacity-80">
                Histórico completo (Receitas - Despesas)
              </div>
            </div>

            {/* Resumo do Mês Selecionado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-red-100 rounded-full text-red-600"><ArrowDown size={16} /></div>
                  <span className="text-sm text-gray-600 font-medium">Saídas</span>
                </div>
                <span className="text-lg font-bold text-gray-800">{showBalance ? formatCurrency(metrics.monthExpense) : '••••'}</span>
              </div>
              <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600"><ArrowUp size={16} /></div>
                  <span className="text-sm text-gray-600 font-medium">Entradas</span>
                </div>
                <span className="text-lg font-bold text-gray-800">{showBalance ? formatCurrency(metrics.monthIncome) : '••••'}</span>
              </div>
            </div>

            {/* Lista de Transações */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-bold text-gray-800">Transações</h2>
                <span className="text-xs text-gray-400">{statement.length} lançamentos</span>
              </div>
              
              <div className="space-y-4">
                {statement.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 bg-white/40 rounded-2xl border border-dashed border-gray-300">
                    <p>Sem lançamentos para este mês.</p>
                  </div>
                ) : (
                  statement.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100/50">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm text-white ${getColorByCategory(item.category?.slug || item.type)}`}>
                          {getIconByCategory(item.category?.slug)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">{item.description}</h3>
                          <p className="text-xs text-gray-500">{item.category?.name || 'Geral'} • {item.isFixed ? 'Fixa' : (item.type === 'income' ? 'Receita' : 'Despesa')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-sm ${item.type === 'expense' ? 'text-gray-800' : 'text-emerald-600'}`}>
                          {item.type === 'expense' ? '- ' : '+ '}{formatCurrency(item.amount)}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateRelative(item.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Menus e Modais */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30" />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
          {isMenuOpen && (
            <div className="flex flex-col items-end gap-3 pointer-events-auto mb-2">
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.8 }} transition={{ delay: 0.05 }} className="flex items-center gap-3">
                <span className="bg-white px-3 py-1.5 rounded-xl shadow-sm text-sm font-bold text-gray-600">Receita</span>
                <button onClick={() => { setActiveModal('income'); setIsMenuOpen(false); }} className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 rounded-full text-white shadow-lg shadow-emerald-500/40 flex items-center justify-center transition-colors"><ArrowUpCircle size={24} /></button>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.8 }} className="flex items-center gap-3">
                <span className="bg-white px-3 py-1.5 rounded-xl shadow-sm text-sm font-bold text-gray-600">Despesa</span>
                <button onClick={() => { setActiveModal('expense'); setIsMenuOpen(false); }} className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg shadow-red-500/40 flex items-center justify-center transition-colors"><ArrowDownCircle size={24} /></button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 pointer-events-auto ${isMenuOpen ? 'bg-gray-800 rotate-45 shadow-gray-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/40'}`}><Plus size={28} className="text-white" /></motion.button>
      </div>

      <AnimatePresence>
        {activeModal === 'expense' && (
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setActiveModal(null)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10"><ExpenseForm onClose={() => setActiveModal(null)} onSuccess={handleSuccess} /></div>
          </motion.div>
        )}
        {activeModal === 'income' && (
          <motion.div initial="hidden" animate="visible" exit="exit" variants={modalVariants} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setActiveModal(null)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10"><IncomeForm onClose={() => setActiveModal(null)} onSuccess={handleSuccess} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}