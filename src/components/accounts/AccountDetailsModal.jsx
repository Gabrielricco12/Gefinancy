import { useState } from 'react';
import { X, Trash2, CreditCard, Plus, Landmark } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { AccountsService } from '../../features/accounts/accounts.service';
import CreditCardForm from './CreditCardForm'; // Importa o form de cartão
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountDetailsModal({ account, onClose, onUpdate }) {
  const [isAddingCard, setIsAddingCard] = useState(false);

  // Deletar Conta inteira
  const handleDeleteAccount = async () => {
    if (!confirm(`Tem certeza que deseja apagar a conta "${account.name}" e todos os cartões vinculados?`)) return;
    try {
      await AccountsService.deleteAccount(account.id);
      toast.success("Conta removida.");
      onUpdate?.(); // Atualiza a página
      onClose();    // Fecha modal
    } catch (error) {
      toast.error("Erro ao apagar conta.");
    }
  };

  // Deletar Cartão Específico
  const handleDeleteCard = async (cardId) => {
    if (!confirm("Remover este cartão?")) return;
    try {
      await AccountsService.deleteCard(cardId);
      toast.success("Cartão removido.");
      onUpdate?.();
    } catch (error) {
      toast.error("Erro ao remover cartão.");
    }
  };

  // Se estiver adicionando cartão, mostra o form em cima
  if (isAddingCard) {
    return (
      <CreditCardForm 
        accountId={account.id} 
        onClose={() => setIsAddingCard(false)} 
        onSuccess={onUpdate} 
      />
    );
  }

  return (
    <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col h-[70vh] pb-16">
      {/* Header da Conta */}
      <div className="bg-blue-50 p-6 rounded-t-3xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition text-gray-600"><X size={20} /></button>
        
        <div className="flex flex-col items-center mt-2">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl mb-3 shadow-sm">
                <Landmark size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{account.name}</h2>
            <p className="text-sm text-gray-500 uppercase font-bold tracking-wide mt-1">Saldo Atual</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{formatCurrency(account.balance)}</p>
        </div>
      </div>

      {/* Lista de Cartões */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <CreditCard size={18} /> Cartões Vinculados
            </h3>
            <button 
                onClick={() => setIsAddingCard(true)}
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
            >
                <Plus size={14} /> Novo Cartão
            </button>
        </div>

        <div className="space-y-3">
            {(!account.cards || account.cards.length === 0) ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm">
                    Nenhum cartão de crédito vinculado.
                </div>
            ) : (
                account.cards.map(card => (
                    <div key={card.id} className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-2xl shadow-lg relative overflow-hidden group">
                        {/* Blob decorativo */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/30 rounded-full blur-xl pointer-events-none"></div>
                        
                        <div>
                            <p className="font-bold text-lg">{card.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Limite: {formatCurrency(card.limit_amount)}</p>
                            <div className="flex gap-3 mt-2 text-[10px] text-gray-400">
                                <span>Fecha: dia {card.closing_day}</span>
                                <span>Vence: dia {card.due_day}</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-full transition z-10"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Footer: Excluir Conta */}
      <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-none">
        <button 
            onClick={handleDeleteAccount}
            className="w-full py-3 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
        >
            <Trash2 size={18} /> Excluir Conta Bancária
        </button>
      </div>
    </div>
  );
}