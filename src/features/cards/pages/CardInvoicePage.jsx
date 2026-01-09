import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCardDetails, getCardInvoice } from '../cards.api';
import { ArrowLeft, Calendar, CreditCard, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CardInvoicePage() {
  const { id } = useParams(); // ID do Cartão
  const navigate = useNavigate();
  
  const [card, setCard] = useState(null);
  const [invoice, setInvoice] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  
  // Data de referência para a fatura (padrão: hoje -> fatura atual)
  // Futuramente podemos adicionar botões para navegar entre meses
  const [dateRef, setDateRef] = useState(new Date());

  useEffect(() => {
    async function loadData() {
      try {
        const [cardData, invoiceData] = await Promise.all([
          getCardDetails(id),
          getCardInvoice(id, dateRef)
        ]);
        setCard(cardData);
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Erro ao carregar fatura:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, dateRef]);

  if (loading) return <div className="p-8 text-center">Carregando fatura...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{card.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={14} /> Fecha dia {card.closing_day}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CreditCard size={14} /> Vence dia {card.due_day}
            </span>
          </div>
        </div>
      </div>

      {/* Resumo da Fatura */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">Fatura de {format(dateRef, 'MMMM', { locale: ptBR })}</p>
            <h2 className="text-4xl font-bold text-gray-900 mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.total)}
            </h2>
          </div>
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
            Aberta
          </div>
        </div>
        
        {/* Barra de Limite (Visual) */}
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
                <span>Usado nesta fatura</span>
                <span>Limite Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.limit_amount)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                    className="bg-blue-600 h-full rounded-full" 
                    style={{ width: `${Math.min((invoice.total / card.limit_amount) * 100, 100)}%` }}
                />
            </div>
        </div>
      </div>

      {/* Lista de Itens (Parcelas do Mês) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalhamento</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {invoice.items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Nenhuma compra lançada para este mês.
            </div>
          ) : (
            invoice.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.expenses.description}</p>
                    <p className="text-xs text-gray-500">
                      {item.expenses.categories?.name} • {format(new Date(item.expenses.purchase_date), 'dd/MM')}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Parcela {item.parcel_number}/{item.expenses.total_installments}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}