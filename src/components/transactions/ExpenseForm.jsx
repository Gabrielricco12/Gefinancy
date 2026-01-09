import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { createExpense } from '../../features/transactions/transactions.service';
import { X, Calendar, CreditCard, Tag, Repeat, ArrowDownCircle, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpenseForm({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Estados
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [installments, setInstallments] = useState(1);
  
  // Datas
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Data da Compra
  const [firstPaymentDate, setFirstPaymentDate] = useState(new Date().toISOString().split('T')[0]); // Data do 1º Pagamento

  // Carregar dados
  useEffect(() => {
    async function loadAux() {
      const { data: acc } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('name');
      const { data: cat } = await supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense').order('name');
      
      if (acc) { setAccounts(acc); if(acc.length) setAccountId(acc[0].id); }
      if (cat) { setCategories(cat); if(cat.length) setCategoryId(cat[0].id); }
    }
    if (user) loadAux();
  }, [user]);

  // Sincronizar datas inicialmente (opcional, UX de conveniência)
  // Se o usuário mudar a data da compra, podemos sugerir mudar a do pagamento, 
  // mas se ele já mexeu na do pagamento, respeitamos.
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    // Lógica simples: se o pagamento era igual a compra, atualiza junto. Se era diferente, mantém.
    if (date === firstPaymentDate) {
      setFirstPaymentDate(newDate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.warning('Valor inválido');
    
    setLoading(true);
    try {
      await createExpense({
        userId: user.id,
        accountId,
        categoryId,
        amount: parseFloat(amount.toString().replace(',', '.')),
        description,
        date,
        firstPaymentDate, // Enviando a nova data
        installments: Number(installments)
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar despesa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col h-[90vh] pb-safe">
      
      {/* Header Vermelho Fixo */}
      <div className="bg-red-600 p-6 rounded-t-3xl flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-full"><ArrowDownCircle size={20} /></div>
          <h2 className="font-bold text-xl">Nova Despesa</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>
      </div>

      {/* Conteúdo com Scroll */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        
        {/* Valor */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Valor Total</label>
          <div className="flex items-center mt-1">
            <span className="text-3xl font-bold text-red-600 mr-2">R$</span>
            <input
              type="number" step="0.01" required autoFocus placeholder="0,00"
              className="w-full text-4xl font-bold text-gray-800 border-none outline-none placeholder-gray-200"
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Descrição */}
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Descrição</label>
          <input
            type="text" required placeholder="Ex: iPhone 16 Pro"
            className="w-full bg-transparent text-lg font-medium text-gray-800 outline-none mt-1"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Categoria e Conta */}
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

        {/* Datas (Compra vs Pagamento) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Calendar size={12} /> Data Compra</label>
            <input type="date" required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
              value={date} onChange={handleDateChange} />
          </div>
          
          {/* NOVO CAMPO: Primeira Parcela */}
          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
            <label className="text-xs font-bold text-blue-600 uppercase flex gap-1"><CalendarClock size={12} /> 1ª Parcela</label>
            <input type="date" required className="w-full bg-transparent text-blue-800 font-bold outline-none mt-1 text-sm"
              value={firstPaymentDate} onChange={(e) => setFirstPaymentDate(e.target.value)} />
          </div>
        </div>

        {/* Parcelas */}
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Repeat size={12} /> Quantidade de Parcelas</label>
          <select className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
            value={installments} onChange={(e) => setInstallments(e.target.value)}>
            <option value="1">À vista (1x)</option>
            {[...Array(11)].map((_, i) => <option key={i+2} value={i+2}>{i+2}x Parcelado</option>)}
            {[...Array(12)].map((_, i) => <option key={i+13} value={i+13}>{i+13}x Parcelado</option>)} {/* Até 24x */}
          </select>
        </div>

        {/* Feedback de Parcelamento */}
        {installments > 1 && amount > 0 && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between text-sm text-gray-600">
            <span>Valor da parcela:</span>
            <span className="font-bold text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount/installments)}</span>
          </div>
        )}
        
        <div className="h-4"></div>
      </form>

      {/* Footer com Botão Flutuante (Alto) */}
      <div className="p-6 pt-2 shrink-0 bg-white border-t border-gray-100 pb-16"> 
        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white shadow-xl shadow-red-500/30 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition"
        >
          {loading ? 'Salvando...' : 'Confirmar Despesa'}
        </button>
      </div>
    </div>
  );
}