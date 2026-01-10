import { CreditCard, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/formatters';
import { motion } from 'framer-motion';

export default function SmartCreditCard({ card }) {
  const limit = Number(card.limit_amount || 0);
  const available = Number(card.available_limit || 0);
  const used = limit - available;
  
  // Calcula porcentagem de uso
  const usagePercentage = limit > 0 ? (used / limit) * 100 : 0;

  // Define cores dinâmicas baseadas no risco
  let barColor = 'bg-emerald-500'; 
  let textColor = 'text-emerald-600';
  let bgColor = 'bg-emerald-50';

  if (usagePercentage > 50) {
    barColor = 'bg-yellow-500';
    textColor = 'text-yellow-600';
    bgColor = 'bg-yellow-50';
  }
  if (usagePercentage > 90) {
    barColor = 'bg-red-500';
    textColor = 'text-red-600';
    bgColor = 'bg-red-50';
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden mb-4">
      {/* Background Decorativo */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${bgColor} rounded-bl-full -mr-4 -mt-4 opacity-50`} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <CreditCard size={20} className="text-gray-400" />
            {card.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Vence dia {card.due_day} • Fecha dia {card.closing_day}
          </p>
        </div>
        <div className="text-right">
            <span className="block text-xs text-gray-400 uppercase font-bold">Fatura Atual</span>
            <span className={`text-xl font-bold ${textColor}`}>
                {formatCurrency(used)}
            </span>
        </div>
      </div>

      {/* Barra de Limite */}
      <div className="relative z-10">
        <div className="flex justify-between text-xs mb-2 font-medium text-gray-500">
          <span>Disponível: {formatCurrency(available)}</span>
          <span>Limite: {formatCurrency(limit)}</span>
        </div>
        
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
      </div>
      
      {usagePercentage > 90 && (
         <div className="mt-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg font-bold">
            <AlertCircle size={14} />
            <span>Limite quase estourado!</span>
         </div>
      )}
    </div>
  );
}