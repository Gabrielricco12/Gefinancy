import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
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
  CalendarRange, Plus, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Variantes e Helpers (Mantidos) ---
const slideVariants = { enter: (d) => ({ x: d > 0 ? 300 : -300, opacity: 0 }), center: { zIndex: 1, x: 0, opacity: 1 }, exit: (d) => ({ zIndex: 0, x: d < 0 ? 300 : -300, opacity: 0 }) };
const modalVariants = { hidden: { y: "100%", opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 300 } }, exit: { y: "100%", opacity: 0, transition: { ease: "easeInOut", duration: 0.2 } } };
const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;
const getIconByCategory = (slug) => <ShoppingCart size={20} className="text-white" />;
const getColorByCategory = (slug) => 'bg-blue-500';

export default function DashboardPage() {
  const { user, signOut } = useAuth(); // Adicionado signOut
  
  // UI States
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Data
  const [currentDate, setCurrentDate] = useState(new Date());
  const [[page, direction], setPage] = useState([0, 0]); 
  const [statement, setStatement] = useState([]);
  
  const [metrics, setMetrics] = useState({
    globalBalance: 0, 
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
      
      // 1. Buscar Extrato Mensal
      const monthlyData = await getStatement(user.id, start, end);
      setStatement(monthlyData);

      // Calcular fluxo do Mês
      let mIncome = 0;
      let mExpense = 0;
      monthlyData.forEach(item => {
        const val = Number(item.amount);
        if (item.type === 'income') mIncome += val; 
        else mExpense += val; 
      });

      // 2. Buscar Contas (balance atual)
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('balance') 
        .eq('user_id', user.id);

      // Somar o saldo ATUAL das contas
      const currentAccountsSum = accountsData 
        ? accountsData.reduce((acc, curr) => acc + Number(curr.balance || 0), 0) 
        : 0;

      // Saldo Global = Soma das Contas
      const currentGlobalBalance = currentAccountsSum; 

      setMetrics({
        globalBalance: currentGlobalBalance,
        monthIncome: mIncome,
        monthExpense: mExpense
      });

    } catch (error) {
      console.error("Erro geral no dashboard:", error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user, currentDate]);

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
    setCurrentDate(prev => newDirection > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const handleSuccess = () => {
    toast.success("Salvo com sucesso!");
    setActiveModal(null);
    loadData();
  };

  // Função de Logout
  const handleLogout = async () => {
    try {
        await signOut();
        toast.success("Você saiu com sucesso.");
    } catch (error) {
        toast.error("Erro ao sair.");
    }
  };

  const formattedDate = format(currentDate, "MMMM yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <MainLayout>
      {/* Header com Botão de Logout */}
      <header className="pt-safe px-6 pb-2 flex justify-between items-center z-20 relative bg-gray-50/0 backdrop-blur-sm mt-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Olá, {firstName}</h1>
        </div>
        <button 
            onClick={handleLogout}
            className="p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition border border-red-100"
            title="Sair"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Indicador de Mês */}
      <div className="px-6 py-2 z-20 relative flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CalendarRange size={16} className="text-blue-500" />
            {capitalizedDate}
          </span>
          <span className="text-xs text-gray-400">Fluxo de Caixa</span>
        </div>
      </div>

      <main className="flex-1 px-6 space-y-6 z-10 relative mt-2 overflow-hidden w-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) paginate(1);
              else if (swipe > swipeConfidenceThreshold) paginate(-1);
            }}
            className="h-full cursor-grab active:cursor-grabbing w-full"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : (
              <>
                {/* Saldo Card */}
                <div className="w-full bg-gradient-to-br from-blue-500 to-cyan-400 p-6 rounded-3xl shadow-xl shadow-blue-500/20 text-white relative overflow-hidden mb-6">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                   <div className="flex justify-between items-start mb-2">
                    <span className="text-blue-50 font-medium text-sm flex items-center gap-1">
                       Saldo Atual Total
                    </span>
                    <button onClick={() => setShowBalance(!showBalance)} className="text-blue-100 hover:text-white transition">
                      {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                  <div className="text-3xl font-bold tracking-tight">
                    {showBalance ? formatCurrency(metrics.globalBalance) : '••••••'}
                  </div>
                  <div className="mt-2 text-xs text-blue-100 opacity-80">
                    Soma dos saldos das contas
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-red-100 rounded-full text-red-600"><ArrowDown size={16} /></div>
                      <span className="text-sm text-gray-600 font-medium">Saídas (Mês)</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">{showBalance ? formatCurrency(metrics.monthExpense) : '••••'}</span>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600"><ArrowUp size={16} /></div>
                      <span className="text-sm text-gray-600 font-medium">Entradas (Mês)</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">{showBalance ? formatCurrency(metrics.monthIncome) : '••••'}</span>
                  </div>
                </div>

                <div className="pb-safe">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="font-bold text-gray-800">Transações</h2>
                    <span className="text-xs text-gray-400">{statement.length} lançamentos</span>
                  </div>
                  
                  <div className="space-y-4">
                    {statement.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 bg-white/40 rounded-2xl border border-dashed border-gray-300">
                        <p>Sem lançamentos em {capitalizedDate}.</p>
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
                              <p className="text-xs text-gray-500">{item.category?.name || 'Geral'}</p>
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Menu FAB e Modais */}
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