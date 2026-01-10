import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import MainLayout from '../components/layout/MainLayout';

// Modais (Apenas criação)
import AccountForm from '../components/accounts/AccountForm';
import CategoryManagerModal from '../components/categories/CategoryManagerModal';
import TransactionDetailsModal from '../components/transactions/TransactionDetailsModal';

// Serviços e Utils
import { AccountsService } from '../features/accounts/accounts.service';
import { getStatement } from '../features/transactions/transactions.service';
import { formatCurrency, formatDateRelative } from '../lib/formatters';
import { Plus, Tag, Landmark, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Dados
  const [accounts, setAccounts] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Modais
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null); 

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Busca Apenas Contas (O service já retorna accounts, nós apenas não vamos extrair os cartões)
      const rawAccounts = await AccountsService.getAllWithCards(user.id);
      
      // Filtro visual: Apenas Contas
      const accountList = rawAccounts.map(acc => ({
        ...acc,
        // Opcional: Calcular saldo total consolidado (Saldo + Limite usado?) 
        // Por enquanto, mostramos apenas o saldo real da conta.
      }));

      setAccounts(accountList);

      // 2. Busca Transações Recentes
      const now = new Date();
      const start = subMonths(startOfMonth(now), 1).toISOString(); 
      const end = endOfMonth(now).toISOString();
      const txData = await getStatement(user.id, start, end);
      setTransactions(txData);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  return (
    <MainLayout>
      {/* Header Fixo */}
      <header className="px-6 pt-4 pb-2 mt-2 flex justify-between items-center z-20">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Visão Geral</h1>
          <p className="text-xs text-gray-500">Selecione uma conta para gerenciar</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setIsCategoryModalOpen(true)} 
                className="p-2 bg-white text-gray-600 border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition"
                title="Categorias"
            >
                <Tag size={20} />
            </button>

            <button 
                onClick={() => setIsAccountFormOpen(true)} 
                className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
                title="Nova Conta"
            >
                <Plus size={20} />
            </button>
        </div>
      </header>

      {/* --- Carrossel de Contas (Somente Pais) --- */}
      <section className="mt-4 px-6 overflow-x-auto pb-4 hide-scrollbar z-10 relative">
        <div className="flex gap-4 w-max">
          {loading ? (
             <div className="w-64 h-32 bg-gray-100 rounded-3xl animate-pulse" />
          ) : accounts.length === 0 ? (
             <button 
               onClick={() => setIsAccountFormOpen(true)}
               className="w-full p-6 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2 hover:bg-gray-50 hover:border-blue-300 transition"
             >
               <Landmark size={24} />
               <span className="text-sm font-medium">Criar primeira conta</span>
             </button>
          ) : (
            accounts.map((acc, idx) => (
              <motion.div 
                key={acc.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/accounts/${acc.id}`)} 
                className="w-72 p-6 rounded-[2rem] shadow-lg border border-white/40 flex flex-col justify-between relative overflow-hidden cursor-pointer bg-white text-gray-800 group hover:shadow-xl transition-all"
              >
                {/* Background Decorativo Suave */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-500/10 transition" />
                
                <div className="flex justify-between items-start z-10">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Wallet size={24} />
                  </div>
                  <div className="p-2 text-gray-300 group-hover:text-blue-600 transition">
                    <ArrowRight size={20} />
                  </div>
                </div>

                <div className="mt-6 z-10">
                  <p className="text-sm text-gray-500 font-medium mb-1">{acc.name}</p>
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                     {formatCurrency(acc.balance)}
                  </p>
                  
                  {/* Badge se tiver cartões vinculados */}
                  {acc.cards && acc.cards.length > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      {acc.cards.length} Cartões vinculados
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* --- Últimas Transações (Global) --- */}
      <section className="flex-1 px-6 mt-2 z-10 relative w-full overflow-hidden flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Atividade Recente</h2>
        <div className="flex-1 overflow-y-auto pb-safe space-y-3 pr-2">
           {loading ? (
             <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-blue-600" /></div>
           ) : transactions.length === 0 ? (
             <div className="text-center py-10 opacity-50"><p>Nenhuma transação recente.</p></div>
           ) : (
             transactions.map(item => (
               <motion.button
                 key={item.id}
                 onClick={() => setSelectedTransaction(item)}
                 whileTap={{ scale: 0.98 }}
                 className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center text-left hover:bg-gray-50 transition"
               >
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${item.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {item.type === 'expense' ? 'D' : 'R'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.description}</h3>
                      <p className="text-xs text-gray-400">{formatDateRelative(item.date)}</p>
                    </div>
                 </div>
                 <span className={`font-bold text-sm whitespace-nowrap ${item.type === 'expense' ? 'text-gray-800' : 'text-emerald-600'}`}>
                   {item.type === 'expense' ? '- ' : '+ '}{formatCurrency(item.amount)}
                 </span>
               </motion.button>
             ))
           )}
        </div>
      </section>

      {/* --- Modais --- */}
      <AnimatePresence>
        {isAccountFormOpen && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsAccountFormOpen(false)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10">
              <AccountForm onClose={() => setIsAccountFormOpen(false)} onSuccess={loadData} />
            </div>
          </motion.div>
        )}

        {isCategoryModalOpen && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsCategoryModalOpen(false)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10">
              <CategoryManagerModal onClose={() => setIsCategoryModalOpen(false)} />
            </div>
          </motion.div>
        )}

        {selectedTransaction && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTransaction(null)}>
              <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <TransactionDetailsModal 
                  transaction={selectedTransaction} 
                  onClose={() => setSelectedTransaction(null)}
                  onDeleteSuccess={loadData}
                />
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}