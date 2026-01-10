import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import MainLayout from '../../../components/layout/MainLayout';
import CreditCardForm from '../../../components/accounts/CreditCardForm'; 
import { 
  ArrowLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Loader2,
  CreditCard,
  QrCode,
  X,
  Save,
  Plus,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function AccountDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [account, setAccount] = useState(null);
  const [linkedCards, setLinkedCards] = useState([]); // Novo estado para cartões
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ income: 0, expense: 0 });

  // Modais
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [savingPix, setSavingPix] = useState(false);

  const loadAccountData = async () => {
    try {
      // 1. Dados da Conta + Cartões Vinculados (Join)
      const { data: acc, error: accError } = await supabase
        .from('accounts')
        .select('*, credit_cards(*)') // <--- O PULO DO GATO: Traz os cartões juntos
        .eq('id', id)
        .single();
      
      if (accError) throw accError;

      // 2. Entradas
      const { data: incomes } = await supabase
        .from('incomes')
        .select('*')
        .eq('account_id', id)
        .order('date', { ascending: false });

      // 3. Saídas
      const { data: expenses } = await supabase
        .from('installments')
        .select(`
          id, amount, due_date, paid_date, 
          expenses (description, category_id, categories(name))
        `)
        .eq('account_id', id)
        .order('paid_date', { ascending: false });

      // Processamento de Histórico
      const incomeList = (incomes || []).map(i => ({
        id: i.id, type: 'income', description: i.description, amount: Number(i.amount), date: i.date, category: 'Entrada'
      }));

      const expenseList = (expenses || []).map(e => ({
        id: e.id, type: 'expense', description: e.expenses?.description || 'Despesa', amount: Number(e.amount), date: e.paid_date || e.due_date, category: e.expenses?.categories?.name || 'Geral'
      }));

      const unified = [...incomeList, ...expenseList].sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalIncome = incomeList.reduce((acc, item) => acc + item.amount, 0);
      const totalExpense = expenseList.reduce((acc, item) => acc + item.amount, 0);

      setAccount(acc);
      setLinkedCards(acc.credit_cards || []); // Salva os cartões separadamente
      
      if (acc.pix_key) {
        setPixKey(acc.pix_key);
        setPixKeyType(acc.pix_key_type || 'cpf');
      }

      setHistory(unified);
      setMetrics({ income: totalIncome, expense: totalExpense });

    } catch (error) {
      console.error("Erro ao carregar conta:", error);
      toast.error("Erro ao carregar detalhes da conta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccountData(); }, [id]);

  const handleSavePix = async (e) => {
    e.preventDefault();
    setSavingPix(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ pix_key: pixKey, pix_key_type: pixKeyType })
        .eq('id', id);
      if (error) throw error;
      toast.success("Pix atualizado!");
      setAccount({ ...account, pix_key: pixKey, pix_key_type: pixKeyType });
      setIsPixModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar Pix.");
    } finally {
      setSavingPix(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!account) return null;

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800 truncate">{account.name}</h1>
      </div>

      <div className="px-6 space-y-6 pb-24">
        
        {/* HERO: Saldo da Conta */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-[2rem] shadow-xl shadow-blue-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                <Wallet size={14} className="text-white" />
                <span className="text-xs font-bold uppercase tracking-wider">Saldo em Conta</span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(account.balance)}</h2>
            </div>
          </div>
        </div>

        {/* --- SEÇÃO DE CARTÕES VINCULADOS (Novo) --- */}
        <div>
          <div className="flex justify-between items-end mb-3">
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Cartões de Crédito</h3>
             <button 
                onClick={() => setIsAddingCard(true)}
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition flex items-center gap-1"
             >
                <Plus size={14} /> Novo
             </button>
          </div>

          {linkedCards.length === 0 ? (
             // Empty State Cartões
             <button 
                onClick={() => setIsAddingCard(true)}
                className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:bg-blue-50/50 transition group"
             >
                <div className="p-3 bg-gray-100 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition">
                   <CreditCard size={24} />
                </div>
                <span className="text-sm font-medium">Vincular Cartão de Crédito</span>
             </button>
          ) : (
             // Lista de Cartões (Horizontal Scroll se tiver muitos)
             <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar snap-x">
                {linkedCards.map(card => (
                   <div 
                      key={card.id}
                      onClick={() => navigate(`/cards/${card.id}`)}
                      className="min-w-[85%] sm:min-w-[280px] bg-gray-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden snap-center cursor-pointer active:scale-98 transition-transform"
                   >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl -mr-5 -mt-5" />
                      
                      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                         <div className="flex justify-between items-start">
                            <CreditCard className="text-gray-400" size={24} />
                            <ChevronRight className="text-gray-500" size={20} />
                         </div>
                         
                         <div>
                            <p className="font-medium text-lg truncate">{card.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                                  Fecha dia {card.closing_day}
                               </span>
                               <span className="text-xs text-gray-400">
                                  Limite: {formatCurrency(card.limit_amount)}
                               </span>
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>

        {/* Ações Secundárias (Pix) */}
        <div className="grid grid-cols-1">
          <button 
            onClick={() => setIsPixModalOpen(true)}
            className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                  <QrCode size={20} />
               </div>
               <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">Minha Chave Pix</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                     {account.pix_key ? `${account.pix_key_type.toUpperCase()}: ${account.pix_key}` : 'Não configurada'}
                  </p>
               </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>

        {/* Métricas e Histórico */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="p-1.5 bg-emerald-50 rounded-full"><TrendingUp size={16} /></div>
              <span className="text-xs font-bold uppercase tracking-wide opacity-70">Entradas</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(metrics.income)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-500">
              <div className="p-1.5 bg-red-50 rounded-full"><TrendingDown size={16} /></div>
              <span className="text-xs font-bold uppercase tracking-wide opacity-70">Saídas</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(metrics.expense)}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1 mb-3">Últimas Movimentações</h3>
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">Nenhuma movimentação.</p>
              </div>
            ) : (
              history.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {item.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 text-sm line-clamp-1">{item.description}</span>
                      <span className="text-xs text-gray-400 font-medium">{format(new Date(item.date), "d 'de' MMM", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <span className={`font-bold text-sm whitespace-nowrap ${item.type === 'income' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {item.type === 'expense' && '- '}{formatCurrency(item.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isAddingCard && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsAddingCard(false)} />
            <div className="pointer-events-auto w-full max-w-md relative z-10">
              <CreditCardForm accountId={id} onClose={() => setIsAddingCard(false)} onSuccess={loadAccountData} />
            </div>
          </motion.div>
        )}

        {isPixModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-purple-600 p-6 flex justify-between items-center text-white">
                   <div className="flex items-center gap-2">
                      <QrCode size={24} /> <h2 className="font-bold text-xl">Chave Pix</h2>
                   </div>
                   <button onClick={() => setIsPixModalOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20}/></button>
                </div>
                <form onSubmit={handleSavePix} className="p-6 space-y-4">
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label>
                      <select value={pixKeyType} onChange={e => setPixKeyType(e.target.value)} className="w-full bg-gray-50 p-4 rounded-xl mt-1 outline-none">
                         <option value="cpf">CPF</option>
                         <option value="email">E-mail</option>
                         <option value="phone">Celular</option>
                         <option value="random">Aleatória</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chave</label>
                      <input type="text" value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Digite sua chave..." className="w-full bg-gray-50 p-4 rounded-xl mt-1 outline-none font-medium"/>
                   </div>
                   <button type="submit" disabled={savingPix} className="w-full py-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition">
                      {savingPix ? <Loader2 className="animate-spin"/> : "Salvar"}
                   </button>
                </form>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}