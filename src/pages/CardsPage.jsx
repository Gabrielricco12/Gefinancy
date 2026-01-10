import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { supabase } from '../lib/supabase';
import SmartCreditCard from '../components/cards/SmartCreditCard';
import { Loader2, Plus } from 'lucide-react';

export default function CardsPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCards() {
      if (!user) return;
      try {
        // Busca cartões (RLS permite ver da família)
        const { data, error } = await supabase
          .from('credit_cards')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCards(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, [user]);

  return (
    <MainLayout>
      <div className="pt-safe px-6 pb-2">
        <h1 className="text-xl font-bold text-gray-800">Meus Cartões</h1>
      </div>

      <div className="px-6 mt-4 pb-safe">
        {loading ? (
           <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : cards.length === 0 ? (
           <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
             Você não tem cartões cadastrados.
           </div>
        ) : (
           cards.map(card => (
             <SmartCreditCard key={card.id} card={card} />
           ))
        )}
      </div>
      
      {/* Botão Flutuante para Adicionar Cartão (Opcional) */}
      <div className="fixed bottom-24 right-6">
        <button className="w-14 h-14 bg-gray-900 rounded-full shadow-lg flex items-center justify-center text-white">
           <Plus size={24} />
        </button>
      </div>
    </MainLayout>
  );
}