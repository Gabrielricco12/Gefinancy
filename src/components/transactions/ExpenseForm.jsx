import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { createExpense } from '../../features/transactions/transactions.service';
import { X, Calendar, CreditCard, Tag, Repeat, ArrowDownCircle, CalendarClock, Wallet, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpenseForm({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Dados do Banco
  const [sources, setSources] = useState({ accounts: [], cards: [] });
  const [categories, setCategories] = useState([]);

  // Form States
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSource, setSelectedSource] = useState(''); // Formato: "type::id" (ex: "account::123" ou "card::456")
  const [categoryId, setCategoryId] = useState('');
  const [installments, setInstallments] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('debit'); // debit, pix, cash, transfer
  
  // Datas
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [firstPaymentDate, setFirstPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Carregar dados (Contas + Cartões + Categorias)
  useEffect(() => {
    async function loadData() {
      try {
        const [accRes, cardRes, catRes] = await Promise.all([
          supabase.from('accounts').select('*').eq('user_id', user.id).order('name'),
          supabase.from('credit_cards').select('*').eq('user_id', user.id).order('name'),
          supabase.from('categories').select('*').eq('user_id', user.id).eq('type', 'expense').order('name')
        ]);

        if (accRes.data) {
            // Se tiver conta, seleciona a primeira por padrão
            const accounts = accRes.data;
            const cards = cardRes.data || [];
            
            setSources({ accounts, cards });
            
            // Define padrão: 1º Cartão ou 1ª Conta
            if (cards.length > 0) setSelectedSource(`card::${cards[0].id}`);
            else if (accounts.length > 0) setSelectedSource(`account::${accounts[0].id}`);
        }

        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
          setCategoryId(catRes.data[0].id);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    if (user) loadData();
  }, [user]);

  // Manipular mudança de data
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    if (date === firstPaymentDate) setFirstPaymentDate(newDate);
  };

  // Helper para identificar o tipo selecionado (conta ou cartão)
  const getSelectedSourceDetails = () => {
    if (!selectedSource) return null;
    const [type, id] = selectedSource.split('::');
    if (type === 'account') return { type, data: sources.accounts.find(a => a.id === id) };
    if (type === 'card') return { type, data: sources.cards.find(c => c.id === id) };
    return null;
  };

  const currentSource = getSelectedSourceDetails();

  // Efeito: Se selecionar uma conta com PIX, muda o método para PIX automaticamente
  useEffect(() => {
    if (currentSource?.type === 'account' && currentSource.data?.pix_key) {
      setPaymentMethod('pix');
    } else if (currentSource?.type === 'account') {
      setPaymentMethod('debit');
    }
  }, [selectedSource]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.warning('Valor inválido');
    if (!selectedSource) return toast.warning('Selecione uma forma de pagamento');
    
    setLoading(true);
    try {
      const [type, id] = selectedSource.split('::');
      
      const payload = {
        userId: user.id,
        amount: parseFloat(amount.toString().replace(',', '.')),
        description,
        categoryId,
        date,
        firstPaymentDate,
        installments: Number(installments),
        // Lógica condicional baseada na seleção
        accountId: type === 'account' ? id : null, // Se for conta, manda ID
        creditCardId: type === 'card' ? id : null, // Se for cartão, manda ID
        paymentMethod: type === 'card' ? 'credit_card' : paymentMethod, // 'pix', 'debit', etc.
      };

      await createExpense(payload);
      
      toast.success('Despesa salva!');
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
      
      {/* Header */}
      <div className="bg-red-600 p-6 rounded-t-3xl flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-full"><ArrowDownCircle size={20} /></div>
          <h2 className="font-bold text-xl">Nova Despesa</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>
      </div>

      {/* Form Content */}
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
            type="text" required placeholder="Ex: Jantar, Uber, Netflix..."
            className="w-full bg-transparent text-lg font-medium text-gray-800 outline-none mt-1"
            value={description} onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Seleção de Fonte (Conta ou Cartão) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase flex gap-1 items-center">
                    {currentSource?.type === 'card' ? <CreditCard size={12}/> : <Wallet size={12}/>} 
                    Pagamento via
                </label>
                <select 
                    required 
                    className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm font-medium"
                    value={selectedSource} 
                    onChange={(e) => setSelectedSource(e.target.value)}
                >
                    {/* Grupo de Cartões */}
                    {sources.cards.length > 0 && (
                        <optgroup label="Cartões de Crédito">
                            {sources.cards.map(c => (
                                <option key={c.id} value={`card::${c.id}`}>💳 {c.name}</option>
                            ))}
                        </optgroup>
                    )}
                    {/* Grupo de Contas */}
                    {sources.accounts.length > 0 && (
                        <optgroup label="Contas Bancárias / Carteira">
                            {sources.accounts.map(a => (
                                <option key={a.id} value={`account::${a.id}`}>
                                    🏦 {a.name} {a.pix_key ? '(Pix Ativo)' : ''}
                                </option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            {/* Categoria */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Tag size={12} /> Categoria</label>
                <select required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
                    value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
        </div>

        {/* Método Específico (Só aparece se for CONTA, se for cartão é crédito automático) */}
        {currentSource?.type === 'account' && (
            <div className="flex gap-2">
                 <button
                    type="button"
                    onClick={() => setPaymentMethod('debit')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${paymentMethod === 'debit' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-100 text-gray-500'}`}
                >
                    Débito
                </button>
                <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition flex items-center justify-center gap-1 ${paymentMethod === 'pix' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-100 text-gray-500'}`}
                >
                    <QrCode size={14}/> Pix
                </button>
                <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${paymentMethod === 'cash' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-gray-100 text-gray-500'}`}
                >
                    Dinheiro
                </button>
            </div>
        )}

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Calendar size={12} /> Data Compra</label>
            <input type="date" required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
              value={date} onChange={handleDateChange} />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
            <label className="text-xs font-bold text-blue-600 uppercase flex gap-1"><CalendarClock size={12} /> 1ª Parcela/Pgto</label>
            <input type="date" required className="w-full bg-transparent text-blue-800 font-bold outline-none mt-1 text-sm"
              value={firstPaymentDate} onChange={(e) => setFirstPaymentDate(e.target.value)} />
          </div>
        </div>

        {/* Parcelas (Sempre visível, mas comum em cartão) */}
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Repeat size={12} /> Parcelamento</label>
          <select className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
            value={installments} onChange={(e) => setInstallments(e.target.value)}>
            <option value="1">À vista (1x)</option>
            {[...Array(11)].map((_, i) => <option key={i+2} value={i+2}>{i+2}x Parcelado</option>)}
            {[...Array(12)].map((_, i) => <option key={i+13} value={i+13}>{i+13}x Parcelado</option>)}
          </select>
        </div>

        {installments > 1 && amount > 0 && (
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between text-sm text-gray-600">
            <span>Valor da parcela:</span>
            <span className="font-bold text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount/installments)}</span>
          </div>
        )}
        
        <div className="h-8"></div>
      </form>

      {/* Footer */}
      <div className="p-6 pt-2 shrink-0 bg-white border-t border-gray-100 pb-16"> 
        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white shadow-xl shadow-red-500/30 bg-red-600 hover:bg-red-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          {loading ? 'Processando...' : (
             <>Confirmar {currentSource?.type === 'card' ? 'no Crédito' : (paymentMethod === 'pix' ? 'via Pix' : 'Despesa')}</>
          )}
        </button>
      </div>
    </div>
  );
}