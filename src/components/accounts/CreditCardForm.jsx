import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { AccountsService } from '../../features/accounts/accounts.service';
import { X, CreditCard, DollarSign, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

export default function CreditCardForm({ accountId, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('1');
  const [dueDay, setDueDay] = useState('10');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await AccountsService.createCard({
        userId: user.id,
        accountId, // ID da conta pai
        name,
        limit: parseFloat(limit.replace(',', '.') || '0'),
        closingDay: parseInt(closingDay),
        dueDay: parseInt(dueDay)
      });
      toast.success("Cartão vinculado!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar cartão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col pb-16 animate-in slide-in-from-bottom-10">
      <div className="bg-gray-900 p-6 rounded-t-3xl flex justify-between items-center text-white shrink-0">
         <div className="flex items-center gap-2">
            <CreditCard size={24} />
            <h2 className="font-bold text-xl">Novo Cartão</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Apelido do Cartão</label>
          <input type="text" required autoFocus placeholder="Ex: Roxinho, Black"
            className="w-full bg-gray-50 p-4 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-purple-100 font-medium text-lg"
            value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Limite Total</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-4 text-gray-400" size={20} />
            <input type="number" step="0.01" placeholder="Ex: 5000,00"
              className="w-full bg-gray-50 p-4 pl-12 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-purple-100 font-bold text-lg"
              value={limit} onChange={e => setLimit(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><CalendarClock size={12}/> Fecha dia</label>
            <select className="w-full bg-gray-50 p-4 rounded-xl mt-1 outline-none" value={closingDay} onChange={e => setClosingDay(e.target.value)}>
              {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><CalendarClock size={12}/> Vence dia</label>
            <select className="w-full bg-gray-50 p-4 rounded-xl mt-1 outline-none" value={dueDay} onChange={e => setDueDay(e.target.value)}>
              {[...Array(31)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white bg-gray-900 hover:bg-black transition shadow-lg shadow-gray-500/30">
          {loading ? 'Salvando...' : 'Adicionar Cartão'}
        </button>
      </form>
    </div>
  );
}