import { X, Trash2, Calendar, Tag, CreditCard } from 'lucide-react';
import { formatCurrency, formatDateRelative } from '../../lib/formatters';
import { deleteTransaction } from '../../features/transactions/transactions.service';
import { toast } from 'sonner';

export default function TransactionDetailsModal({ transaction, onClose, onDeleteSuccess }) {
  if (!transaction) return null;

  const handleDelete = async () => {
    if (!confirm('Deseja excluir esta transação?')) return;
    try {
      await deleteTransaction(transaction.id, transaction.type);
      toast.success('Transação excluída');
      onDeleteSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const isExpense = transaction.type === 'expense';

  return (
    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 relative m-4">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
        <X size={20} />
      </button>

      <div className="flex flex-col items-center mt-4 mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isExpense ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
           <span className="text-2xl font-bold">{isExpense ? 'D' : 'R'}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 text-center">{transaction.description}</h2>
        <p className={`text-2xl font-bold mt-2 ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
          {isExpense ? '-' : '+'} {formatCurrency(transaction.amount)}
        </p>
      </div>

      <div className="space-y-4 bg-gray-50 p-4 rounded-2xl">
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

        {transaction.category?.slug && (
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-gray-500">
               <CreditCard size={16} /> <span className="text-sm">Conta</span>
             </div>
             {/* O getStatement atual não traz nome da conta por padrão, seria ideal ajustar o join, mas deixamos genérico por enquanto */}
             <span className="font-medium text-gray-800">...</span>
           </div>
        )}
      </div>

      <button 
        onClick={handleDelete}
        className="w-full mt-6 py-3 rounded-xl border border-red-100 text-red-600 font-bold hover:bg-red-50 flex items-center justify-center gap-2"
      >
        <Trash2 size={18} /> Excluir Transação
      </button>
    </div>
  );
}