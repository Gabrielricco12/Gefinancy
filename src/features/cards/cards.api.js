import { supabase } from '../../lib/supabase';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export const getCardDetails = async (cardId) => {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', cardId)
    .single();
  
  if (error) throw error;
  return data;
};

export const getCardInvoice = async (cardId, referenceDate = new Date()) => {
  // A lógica de fatura baseada em parcelas:
  // Buscamos todas as parcelas que vencem neste mês e pertencem a uma despesa feita neste cartão.
  
  const start = startOfMonth(referenceDate).toISOString();
  const end = endOfMonth(referenceDate).toISOString();

  // Query complexa: Join Installments -> Expenses (filtra por card_id) -> Categories
  const { data, error } = await supabase
    .from('installments')
    .select(`
      id,
      amount,
      due_date,
      parcel_number,
      expenses!inner (
        description,
        purchase_date,
        total_installments,
        credit_card_id,
        categories (name, id)
      )
    `)
    .eq('expenses.credit_card_id', cardId)
    .gte('due_date', start)
    .lte('due_date', end)
    .order('due_date', { ascending: true });

  if (error) throw error;
  
  // Calcula totais
  const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);
  
  return {
    items: data,
    total: totalAmount,
    month: referenceDate.getMonth(),
    year: referenceDate.getFullYear()
  };
};