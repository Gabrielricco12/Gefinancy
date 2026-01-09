import { X, Trash2, Calendar, Tag, Wallet, User } from 'lucide-react';
import { formatCurrency, formatDateRelative } from '../../lib/formatters';
import { deleteTransaction } from '../../features/transactions/transactions.service';
import { useAuth } from '../../features/auth/AuthContext';
import { toast } from 'sonner';

export default function TransactionDetailsModal({ transaction, onClose, onDeleteSuccess }) {
  const { user } = useAuth(); // Pegamos o usuário logado para comparar

  if (!transaction) return null;

  const handleDelete = async () => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    try {
      await deleteTransaction(transaction.id, transaction.type);
      toast.success('Transação excluída');
      onDeleteSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir');
    }
  };

  const isExpense = transaction.type === 'expense';
  
  // Verifica se a transação pertence ao usuário logado
  // Nota: Para isso funcionar 100%, o 'getStatement' precisa retornar o campo 'user_id'
  const isOwner = user && transaction.user_id === user.id;

  return (
    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative m-4 animate-in zoom-in-95 duration-200">
      
      {/* Botão Fechar */}
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
        <X size={20} />
      </button>

      {/* Cabeçalho do Modal */}
      <div className="flex flex-col items-center mt-4 mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${isExpense ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
           <span className="text-2xl font-bold">{isExpense ? 'D' : 'R'}</span>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 text-center px-2">{transaction.description}</h2>
        
        <p className={`text-2xl font-bold mt-2 ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
          {isExpense ? '-' : '+'} {formatCurrency(transaction.amount)}
        </p>

        {/* Badge de Quem Criou (Família) */}
        {transaction.user_id && (
          <div className={`mt-3 flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${isOwner ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
             <User size={12} />
             <span>
               {isOwner ? 'Criado por Você' : 'Criado pelo Parceiro(a)'}
             </span>
          </div>
        )}
      </div>

      {/* Lista de Detalhes */}
      <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={16} /> <span className="text-sm">Data</span>
          </div>
          <span className="font-medium text-gray-800">{formatDateRelative(transaction.date)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <Tag size={16} /> <span className="text-sm">Categoria</span>
          </div>
          <span className="font-medium text-gray-800">{transaction.category?.name || 'Geral'}</span>
        </div>

        {/* Mostra Conta se disponível */}
        {transaction.account_name && (
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-500">
               <Wallet size={16} /> <span className="text-sm">Conta</span>
             </div>
             <span className="font-medium text-gray-800">{transaction.account_name}</span>
           </div>
        )}
      </div>

      {/* Botão de Ação */}
      <button 
        onClick={handleDelete}
        className="w-full mt-6 py-3 rounded-xl border border-red-100 text-red-600 font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition active:scale-[0.98]"
      >
        <Trash2 size={18} /> Excluir Transação
      </button>
    </div>
  );
}