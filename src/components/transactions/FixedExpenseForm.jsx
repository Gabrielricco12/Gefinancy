import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { FixedExpensesService } from '../../features/fixed-expenses/fixed-expenses.service';
import { X, CalendarClock, Tag, Repeat, Calendar, Hourglass } from 'lucide-react';
import { toast } from 'sonner';
import { addMonths, format, getDate, parseISO } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';

export default function FixedExpenseForm({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Estados Básicos
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDay, setDueDay] = useState('5');

  // Estados de Recorrência Avançada
  const [isInfinite, setIsInfinite] = useState(true); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalMonths, setTotalMonths] = useState(12);

  useEffect(() => {
    async function loadCats() {
      // REMOVIDO: .eq('user_id', user.id)
      const { data } = await supabase.from('categories').select('*').eq('type', 'expense').order('name');
      if (data) { setCategories(data); if(data.length) setCategoryId(data[0].id); }
    }
    if (user) loadCats();
  }, [user]);

  const calculateEndDate = () => {
    if (isInfinite || !totalMonths || totalMonths <= 0 || !startDate) return null;

    const startObj = parseISO(startDate);
    const startDay = getDate(startObj);
    const dueDayNum = parseInt(dueDay);

    let offset = totalMonths - 1; 
    
    if (startDay > dueDayNum) {
      offset += 1; 
    }

    return addMonths(startObj, offset);
  };

  const endDate = calculateEndDate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.warning('Valor inválido');
    
    setLoading(true);
    try {
      await FixedExpensesService.create({
        userId: user.id,
        categoryId,
        description,
        amount: parseFloat(amount.toString().replace(',', '.')),
        dueDay: parseInt(dueDay),
        startDate: startDate,
        totalMonths: isInfinite ? null : parseInt(totalMonths)
      });
      toast.success("Despesa fixa criada!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col h-[90vh] pb-safe">
      <div className="bg-indigo-600 p-6 rounded-t-3xl flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-full"><Repeat size={20} /></div>
          <h2 className="font-bold text-xl">Nova Despesa Fixa</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Valor Mensal</label>
          <div className="flex items-center mt-1">
            <span className="text-3xl font-bold text-indigo-600 mr-2">R$</span>
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
            type="text" required placeholder="Ex: Aluguel, Empréstimo"
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
            <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><CalendarClock size={12} /> Dia Vencimento</label>
            <select required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
              value={dueDay} onChange={(e) => setDueDay(e.target.value)}>
              {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>Dia {i+1}</option>)}
            </select>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase flex gap-1 mb-3"><Hourglass size={12} /> Tipo de Recorrência</label>
          
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button 
              type="button"
              onClick={() => setIsInfinite(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isInfinite ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              Indeterminado (Ex: Aluguel)
            </button>
            <button 
              type="button"
              onClick={() => setIsInfinite(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isInfinite ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              Determinado (Ex: Empréstimo)
            </button>
          </div>
        </div>

        {!isInfinite && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Calendar size={12} /> Início</label>
              <input type="date" required className="w-full bg-transparent text-gray-700 outline-none mt-1 text-sm"
                value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
              <label className="text-xs font-bold text-gray-400 uppercase flex gap-1"><Repeat size={12} /> Total Meses</label>
              <input type="number" min="1" required className="w-full bg-transparent text-gray-700 outline-none mt-1"
                placeholder="Ex: 12" value={totalMonths} onChange={(e) => setTotalMonths(e.target.value)} />
            </div>
          </div>
        )}

        {endDate && (
           <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-sm text-indigo-700 flex items-center gap-2">
             <Hourglass size={16} />
             <span>
               Última parcela prevista para <strong>{format(endDate, 'MMMM yyyy', { locale: ptBR })}</strong>.
             </span>
           </div>
        )}

        <div className="h-4"></div>
      </form>

      <div className="p-6 pt-2 shrink-0 bg-white border-t border-gray-100 pb-16">
        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-white shadow-xl shadow-indigo-500/30 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition"
        >
          {loading ? 'Salvando...' : 'Confirmar Fixa'}
        </button>
      </div>
    </div>
  );
}