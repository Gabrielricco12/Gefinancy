import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import MainLayout from '../components/layout/MainLayout';

// Modais
import AccountForm from '../components/accounts/AccountForm';
import AccountDetailsModal from '../components/accounts/AccountDetailsModal';
import CategoryManagerModal from '../components/categories/CategoryManagerModal';
import TransactionDetailsModal from '../components/transactions/TransactionDetailsModal';

// Serviços e Utils
import { AccountsService } from '../features/accounts/accounts.service';
import { getStatement } from '../features/transactions/transactions.service';
import { formatCurrency, formatDateRelative } from '../lib/formatters';
import { Plus, Tag, CreditCard, Landmark, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { user } = useAuth();
  
  // Dados
  const [displayAccounts, setDisplayAccounts] = useState([]); // Lista achatada para o carrossel
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Modais
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false); // Criação de Conta
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // Gerenciador de Categorias
  const [selectedAccountForDetails, setSelectedAccountForDetails] = useState(null); // Detalhes da Conta (e Cartões)
  const [selectedTransaction, setSelectedTransaction] = useState(null); // Detalhes da Transação

  // Função Principal de Carregamento
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Buscar Contas e seus Cartões
      const rawAccounts = await AccountsService.getAllWithCards(user.id);
      
      // 2. Achatar a estrutura para o Carrossel
      const flatList = [];
      rawAccounts.forEach(acc => {
        // Objeto Conta
        flatList.push({
          ...acc, 
          viewType: 'account', // Identificador visual
        });

        // Objetos Cartão (Filhos)
        if (acc.cards && acc.cards.length > 0) {
          acc.cards.forEach(card => {
            flatList.push({
              ...card,
              viewType: 'card',
              parentAccount: acc // Referência ao pai para navegação
            });
          });
        }
      });

      setDisplayAccounts(flatList);

      // 3. Buscar Transações (Últimos 2 meses)
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

  // Handler: Ao clicar no Card do Carrossel
  const handleCardClick = (item) => {
    if (item.viewType === 'account') {
      setSelectedAccountForDetails(item);
    } else if (item.viewType === 'card' && item.parentAccount) {
      // Se clicar no cartão, abrimos a conta pai dele (onde gerencia o cartão)
      setSelectedAccountForDetails(item.parentAccount);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <header className="px-6 pt-4 pb-2 mt-2 flex justify-between items-center z-20">
        <h1 className="text-2xl font-bold text-gray-800">Minhas Contas</h1>
        
        <div className="flex gap-2">
            {/* Botão: Categorias */}
            <button 
                onClick={() => setIsCategoryModalOpen(true)} 
                className="p-2 bg-white text-gray-600 border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition"
                title="Gerenciar Categorias"
            >
                <Tag size={20} />
            </button>

            {/* Botão: Nova Conta */}
            <button 
                onClick={() => setIsAccountFormOpen(true)} 
                className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
                title="Nova Conta Bancária"
            >
                <Plus size={20} />
            </button>
        </div>
      </header>

      {/* --- Carrossel de Contas e Cartões --- */}
      <section className="mt-2 px-6 overflow-x-auto pb-4 hide-scrollbar z-10 relative">
        <div className="flex gap-4 w-max">
          {loading ? (
             <div className="w-64 h-32 bg-white/50 rounded-2xl animate-pulse" />
          ) : displayAccounts.length === 0 ? (
             <div className="w-full text-gray-500 text-sm italic p-4 bg-white/50 rounded-2xl border border-dashed border-gray-300">
               Nenhuma conta cadastrada.
             </div>
          ) : (
            displayAccounts.map((item, idx) => (
              <motion.div 
                key={`${item.viewType}-${item.id}-${idx}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCardClick(item)}
                className={`w-72 p-5 rounded-3xl shadow-sm border border-white/40 backdrop-blur-md flex flex-col justify-between relative overflow-hidden cursor-pointer ${item.viewType === 'card' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}
              >
                {/* Background Decorativo se for Cartão */}
                {item.viewType === 'card' && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />}
                
                {/* Ícone e Tipo */}
                <div className="flex justify-between items-start z-10">
                  <div className={`p-2 rounded-xl ${item.viewType === 'card' ? 'bg-white/10' : 'bg-blue-50 text-blue-600'}`}>
                    {item.viewType === 'card' ? <CreditCard size={20} /> : <Landmark size={20} />}
                  </div>
                  <span className="text-xs font-medium opacity-60 uppercase">{item.viewType === 'card' ? 'Cartão' : 'Conta'}</span>
                </div>

                {/* Valores */}
                <div className="mt-4 z-10">
                  <p className="text-sm opacity-80">{item.name}</p>
                  <p className="text-2xl font-bold tracking-tight">
                     {item.viewType === 'card' 
                       ? formatCurrency(item.limit_amount) 
                       : formatCurrency(item.balance)
                     }
                  </p>
                  
                  {/* Detalhes específicos de Cartão */}
                  {item.viewType === 'card' && (
                    <div className="mt-2">
                       <div className="flex justify-between text-[10px] opacity-60 mb-1">
                         <span>Limite Total</span>
                         <span>Fecha dia {item.closing_day}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                         <div className="h-full bg-purple-400 w-[30%]" /> 
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* --- Lista de Últimas Movimentações --- */}
      <section className="flex-1 px-6 mt-4 z-10 relative w-full overflow-hidden flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Últimas Movimentações</h2>
        
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
                 className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center text-left"
               >
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${item.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      {item.type === 'expense' ? 'D' : 'R'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.description}</h3>
                      <p className="text-xs text-gray-400">{formatDateRelative(item.date)}</p>
                    </div>
                 </div>
                 <span className={`font-bold text-sm ${item.type === 'expense' ? 'text-gray-800' : 'text-emerald-600'}`}>
                   {item.type === 'expense' ? '- ' : '+ '}{formatCurrency(item.amount)}
                 </span>
               </motion.button>
             ))
           )}
        </div>
      </section>

      {/* --- Modais (Gerenciados via AnimatePresence) --- */}
      <AnimatePresence>
        
        {/* 1. Modal Nova Conta */}
        {isAccountFormOpen && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsAccountFormOpen(false)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10">
              <AccountForm onClose={() => setIsAccountFormOpen(false)} onSuccess={loadData} />
            </div>
          </motion.div>
        )}

        {/* 2. Modal Gerenciar Categorias */}
        {isCategoryModalOpen && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsCategoryModalOpen(false)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10">
              <CategoryManagerModal onClose={() => setIsCategoryModalOpen(false)} />
            </div>
          </motion.div>
        )}

        {/* 3. Modal Detalhes da Conta (Onde adiciona Cartão) */}
        {selectedAccountForDetails && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setSelectedAccountForDetails(null)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10">
              <AccountDetailsModal 
                account={selectedAccountForDetails} 
                onClose={() => setSelectedAccountForDetails(null)} 
                onUpdate={loadData} 
              />
            </div>
          </motion.div>
        )}

        {/* 4. Modal Detalhes da Transação */}
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