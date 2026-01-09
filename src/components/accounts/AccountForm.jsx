import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { AccountsService } from '../../features/accounts/accounts.service';
import { X, Landmark, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountForm({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await AccountsService.createAccount({
        userId: user.id,
        name,
        balance: parseFloat(balance.replace(',', '.') || '0')
      });
      toast.success("Conta criada com sucesso!");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col pb-16">
      <div className="bg-blue-600 p-6 rounded-t-3xl flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
            <Landmark size={24} />
            <h2 className="font-bold text-xl">Nova Conta</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome do Banco/Carteira</label>
          <input type="text" required autoFocus placeholder="Ex: Nubank, Carteira, Cofre"
            className="w-full bg-gray-50 p-4 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-100 font-medium text-lg"
            value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Saldo Atual</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-4 text-gray-400" size={20} />
            <input type="number" step="0.01" placeholder="0,00"
              className="w-full bg-gray-50 p-4 pl-12 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-100 font-bold text-lg"
              value={balance} onChange={e => setBalance(e.target.value)} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
          {loading ? 'Criando...' : 'Confirmar Conta'}
        </button>
      </form>
    </div>
  );
}