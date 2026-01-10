import { supabase } from '../../lib/supabase';

export const createExpense = async (formData) => {
  const {
    description,
    amount,
    date,
    categoryId,
    accountId,      // ID da Conta (obrigatório se não for crédito)
    cardId,         // ID do Cartão (obrigatório se for crédito)
    paymentMethod,  // 'pix', 'credit_card', 'debit_card', etc.
    installments = 1,
    userId
  } = formData;

  // 1. Inserir a Despesa (Cabeçalho)
  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: categoryId,
      account_id: paymentMethod === 'credit_card' ? null : accountId,
      credit_card_id: paymentMethod === 'credit_card' ? cardId : null,
      description,
      total_amount: amount,
      purchase_date: date,
      payment_method: paymentMethod,
      total_installments: paymentMethod === 'credit_card' ? installments : 1
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  // 2. Gerar Parcelas (Installments)
  const expenseId = expenseData.id;
  const installmentsList = [];

  // LÓGICA DE PIX / DÉBITO (Pagamento Imediato)
  if (paymentMethod === 'pix' || paymentMethod === 'debit_card' || paymentMethod === 'cash') {
    installmentsList.push({
      user_id: userId,
      expense_id: expenseId,
      account_id: accountId, // Saiu desta conta
      parcel_number: 1,
      amount: amount,
      due_date: date,     // Vence hoje
      paid_date: date,    // PAGO hoje
      status: 'paid'      // Status finalizado
    });
    
    // Opcional: Atualizar saldo da conta aqui ou deixar trigger cuidar disso
    // Vamos assumir atualização via Trigger ou cálculo em tempo real no dashboard
  } 
  
  // LÓGICA DE CARTÃO DE CRÉDITO
  else if (paymentMethod === 'credit_card') {
    // ... lógica existente de gerar parcelas futuras ...
    // Loop para criar N parcelas com status 'pending'
  }

  const { error: installError } = await supabase
    .from('installments')
    .insert(installmentsList);

  if (installError) {
    // Rollback manual (deletar expense se falhar installments) seria ideal aqui
    console.error('Erro ao criar parcelas', installError);
    throw installError;
  }

  return expenseData;
};