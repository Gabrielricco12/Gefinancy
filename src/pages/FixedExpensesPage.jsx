import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useDate } from '../features/date/DateContext';
import MainLayout from '../components/layout/MainLayout';
import FixedExpenseForm from '../components/transactions/FixedExpenseForm';
import { FixedExpensesService } from '../features/fixed-expenses/fixed-expenses.service';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/formatters';
import { 
  Plus, 
  Trash2, 
  Repeat, 
  Hourglass, 
  CheckCircle, 
  Circle, 
  Wallet, 
  Loader2 // <--- ADICIONADO AQUI
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function FixedExpensesPage() {
  const { user } = useAuth();
  const { currentDate } = useDate(); 
  
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [defaultAccountId, setDefaultAccountId] = useState(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar dados
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Busca despesas com status de pagamento baseados no currentDate
      const data = await FixedExpensesService.getAll(user.id, currentDate);
      setExpenses(data);
      
      // 2. Busca contas para opção de pagamento
      const { data: accs } = await supabase.from('accounts').select('id, name').order('name');
      setAccounts(accs || []);
      if (accs?.length > 0 && !defaultAccountId) setDefaultAccountId(accs[0].id);

    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user, currentDate]);

  // Lógica de Pagar/Estornar
  const togglePayment = async (item) => {
    if (!defaultAccountId && !item.isPaid) {
      toast.warning('Selecione uma conta para debitar o pagamento.');
      return;
    }

    // Update Otimista
    const originalState = [...expenses];
    setExpenses(prev => prev.map(e => e.id === item.id ? { ...e, isPaid: !e.isPaid } : e));

    try {
      if (item.isPaid) {
        await FixedExpensesService.markAsUnpaid(item.paymentId);
        toast.success('Pagamento estornado');
      } else {
        await FixedExpensesService.markAsPaid({
          fixedExpense: item,
          date: new Date().toISOString(), // Paga na data atual real
          accountId: defaultAccountId
        });
        toast.success('Conta paga!');
      }
      await loadData(); // Recarrega para garantir integridade
    } catch (error) {
      console.error(error);
      setExpenses(originalState);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id) => {
    if(!confirm("Remover esta despesa fixa permanentemente?")) return;
    try {
      await FixedExpensesService.delete(id);
      toast.success("Removido!");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover");
    }
  };

  const totalFixed = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalPaid = expenses.filter(e => e.isPaid).reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <MainLayout>
      {/* Header Resumo */}
      <div className="pt-safe px-6 pb-6 bg-white/0 z-10 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">Despesas Fixas</h1>
        </div>
        
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-medium mb-1 flex items-center gap-2">
              <Repeat size={14} /> Total Mensal
            </p>
            <div className="flex items-end gap-2">
                <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(totalFixed)}</h2>
                <span className="text-sm text-indigo-200 mb-1">({Math.round((totalPaid/totalFixed)*100 || 0)}% pago)</span>
            </div>
            
            {/* Seletor de Conta */}
            {accounts.length > 0 && (
                <div className="mt-4 flex items-center gap-2 bg-indigo-700/50 p-2 rounded-xl text-xs w-fit">
                    <Wallet size={12} className="text-indigo-200" />
                    <span className="text-indigo-200">Debitar de:</span>
                    <select 
                        value={defaultAccountId || ''} 
                        onChange={(e) => setDefaultAccountId(e.target.value)}
                        className="bg-transparent font-bold text-white outline-none cursor-pointer"
                    >
                        {accounts.map(a => <option key={a.id} value={a.id} className="text-gray-800">{a.name}</option>)}
                    </select>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 px-6 pb-24 overflow-y-auto space-y-4">
        {loading ? (
          <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-indigo-600" /></div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
            <Repeat size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhuma despesa fixa.</p>
          </div>
        ) : (
          expenses.map((item, index) => {
            const isFinite = item.total_months && item.total_months > 0;
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-all ${item.isPaid ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}
              >
                <div className="flex items-center gap-4">
                  {/* Botão Check */}
                  <button 
                    onClick={() => togglePayment(item)}
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm ${item.isPaid ? 'bg-green-500 text-white shadow-green-500/30' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    {item.isPaid ? <CheckCircle size={24} /> : <Circle size={24} />}
                  </button>

                  <div>
                    <h3 className={`font-bold text-sm ${item.isPaid ? 'text-green-800 line-through opacity-70' : 'text-gray-800'}`}>
                        {item.description}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">Dia {item.due_day}</span>
                        <span>{item.categories?.name}</span>
                        {isFinite && <span className="flex items-center gap-1"><Hourglass size={8}/> {item.total_months}x</span>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`font-bold text-sm ${item.isPaid ? 'text-green-700' : 'text-gray-800'}`}>
                      {formatCurrency(item.amount)}
                  </span>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1.5 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* FAB e Modal */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-colors duration-300 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/40"
      >
        <Plus size={28} className="text-white" />
      </motion.button>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none"
          >
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsFormOpen(false)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10">
              <FixedExpenseForm onClose={() => setIsFormOpen(false)} onSuccess={loadData} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}