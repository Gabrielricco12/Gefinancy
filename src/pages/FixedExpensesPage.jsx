import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import MainLayout from '../components/layout/MainLayout'; // Importar Layout
import FixedExpenseForm from '../components/transactions/FixedExpenseForm';
import { FixedExpensesService } from '../features/fixed-expenses/fixed-expenses.service';
import { formatCurrency } from '../lib/formatters';
import { Plus, Trash2, Repeat, Hourglass, Infinity as InfinityIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function FixedExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await FixedExpensesService.getAll(user.id);
      setExpenses(data);
    } catch (error) {
      toast.error('Erro ao carregar fixas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const handleDelete = async (id) => {
    if(!confirm("Remover esta despesa fixa?")) return;
    try {
      await FixedExpensesService.delete(id);
      toast.success("Removido!");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover");
    }
  };

  const totalFixed = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <MainLayout>
      {/* Header */}
      <header className="pt-safe px-6 pb-6 bg-white/0 z-10 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Despesas Fixas</h1>
        </div>
        
        {/* Card Resumo */}
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-medium mb-1 flex items-center gap-2">
              <Repeat size={14} />
              Custo Mensal Recorrente
            </p>
            <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(totalFixed)}</h2>
          </div>
        </div>
      </header>

      {/* Lista */}
      <main className="flex-1 px-6 py-6 overflow-y-auto space-y-4 w-full">
        {loading ? (
          <p className="text-center text-gray-400 mt-10">Carregando...</p>
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
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-600 font-bold text-xs border border-gray-100 shadow-sm">
                    <span className="text-[10px] uppercase text-gray-400">Dia</span>
                    <span className="text-base text-indigo-600">{item.due_day}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{item.description}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 font-medium">{item.categories?.name}</span>
                      {isFinite ? (
                        <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
                          <Hourglass size={10} /> {item.total_months}x
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          <InfinityIcon size={10} /> Indeterminado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-gray-800 text-base">{formatCurrency(item.amount)}</span>
                  <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1.5 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Botão FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-colors duration-300 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/40"
      >
        <Plus size={28} className="text-white" />
      </motion.button>

      {/* Modal */}
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