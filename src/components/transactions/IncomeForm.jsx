import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { createIncome } from '../../features/transactions/transactions.service';
import { X, Calendar, CreditCard, Tag, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function IncomeForm({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Carregar dados (Filtrando categorias apenas de INCOME)
  useEffect(() => {
    async function loadAux() {
      const { data: acc } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('name');
      const { data: cat } = await supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'income').order('name'); // Só income
      
      if (acc) { setAccounts(acc); if(acc.length) setAccountId(acc[0].id); }
      if (cat) { setCategories(cat); if(cat.length) setCategoryId(cat[0].id); }
    }
    if (user) loadAux();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.warning('Valor inválido');
    
    setLoading(true);
    try {
      await createIncome({
        userId: user.id,
        accountId,
        categoryId,
        amount: parseFloat(amount.toString().replace(',', '.')),
        description,
        date
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar receita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col h-[85vh] pb-safe">
      
      {/* Header Verde */}
      <div className="bg-emerald-600 p-6 rounded-t-3xl flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-full"><ArrowUpCircle size={20} /></div>
          <h2 className="font-bold text-xl">Nova Receita</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Valor a Receber</label>
          <div className="flex items-center mt-1">
            <span className="text-3xl font-bold text-emerald-600 mr-2">R$</span>
            <input
              type="number" step="0.01" required autoFocus placeholder="0,00"
              className="w-full text-4xl font-bold text-gray-800 border-none outline-none placeholder-gray-200"
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Descrição</label>
          <input
            type="text" required placeholder="Ex: Salário"
            className="w-full bg-transparent text-lg font-medium text-gray-800 outline-none mt-1"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Tag size={12} /> Categoria</label>
            <select required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
              value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><CreditCard size={12} /> Conta</label>
            <select required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
              value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Calendar size={12} /> Data de Entrada</label>
          <input type="date" required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
            value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </form>

      <div className="p-6 pt-2 shrink-0 bg-white border-t border-gray-100 pb-16 ">
        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white shadow-xl shadow-emerald-500/30 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition"
        >
          {loading ? 'Salvando...' : 'Confirmar Receita'}
        </button>
      </div>
    </div>
  );
}