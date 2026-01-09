import { supabase } from '../../lib/supabase';
import { addMonths } from 'date-fns';

/**
 * Cria uma NOVA DESPESA com parcelas
 * Suporta Data da Compra vs Data do 1º Pagamento (Cartão de Crédito)
 */
export const createExpense = async ({
  userId,
  accountId,
  categoryId,
  amount,
  description,
  date,             // Data da Compra (Registro histórico)
  firstPaymentDate, // Data do 1º Pagamento (Para calcular vencimentos)
  installments = 1
}) => {
  const purchaseDate = new Date(date);
  // Se não vier data de pagamento específica, usa a data da compra
  const startDate = firstPaymentDate ? new Date(firstPaymentDate) : purchaseDate;
  
  const installmentValue = amount / installments;

  // 1. Inserir o PAI (A Despesa Global)
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: categoryId,
      description,
      total_amount: amount,
      purchase_date: date, 
      total_installments: installments
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  // 2. Preparar as FILHAS (As Parcelas)
  const installmentsPayload = [];

  for (let i = 0; i < installments; i++) {
    // Calcula vencimento baseado na data de INÍCIO do pagamento
    const dueDate = addMonths(startDate, i);
    
    installmentsPayload.push({
      user_id: userId,
      expense_id: expense.id,
      account_id: accountId,
      parcel_number: i + 1,
      amount: installmentValue,
      due_date: dueDate.toISOString(),
      status: 'pending'
    });
  }

  // 3. Inserir as Parcelas em Lote
  const { error: installError } = await supabase
    .from('installments')
    .insert(installmentsPayload);

  if (installError) {
    // Rollback manual se falhar as parcelas
    await supabase.from('expenses').delete().eq('id', expense.id);
    throw installError;
  }

  return expense;
};

/**
 * Cria uma RENDA
 */
export const createIncome = async ({ userId, accountId, categoryId, amount, description, date }) => {
  const { data, error } = await supabase.from('incomes').insert({
    user_id: userId,
    account_id: accountId,
    category_id: categoryId,
    amount,
    description,
    date,
    received: true
  });
  if (error) throw error;
  return data;
};

/**
 * Deleta uma transação
 * Se for 'expense', deleta a parcela específica (tabela installments).
 * Se for 'income', deleta a renda (tabela incomes).
 * * Nota: Para deletar a despesa inteira (todas as parcelas), seria necessário 
 * buscar o parent_id e deletar na tabela 'expenses'.
 */
export const deleteTransaction = async (id, type) => {
  const table = type === 'income' ? 'incomes' : 'installments';
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Busca dados unificados para o Dashboard (Extrato)
 * Unifica Rendas + Parcelas (que são o fluxo real de saída)
 */
export const getStatement = async (userId, startDate, endDate) => {
  // 1. Buscar Rendas
  const { data: incomes } = await supabase
    .from('incomes')
    .select(`*, categories(name, slug)`)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate);

  // 2. Buscar Parcelas (Join com expenses para pegar descrição original)
  const { data: installmentsDeep } = await supabase
    .from('installments')
    .select(`
      id, amount, due_date, status, parcel_number,
      expenses!inner (
        description,
        categories (name, slug)
      )
    `)
    .eq('user_id', userId)
    .gte('due_date', startDate)
    .lte('due_date', endDate);

  // 3. Normalizar Rendas
  const normalizedIncomes = (incomes || []).map(i => ({
    id: i.id,
    type: 'income',
    description: i.description,
    amount: i.amount,
    date: i.date,
    category: i.categories,
    status: i.received ? 'paid' : 'pending'
  }));

  // 4. Normalizar Despesas (Parcelas)
  const normalizedExpenses = (installmentsDeep || []).map(i => ({
    id: i.id, // ID da parcela
    type: 'expense',
    description: `${i.expenses.description} (${i.parcel_number}x)`,
    amount: i.amount,
    date: i.due_date,
    category: i.expenses.categories,
    status: i.status
  }));

  // 5. Unificar e Ordenar por Data (Mais recente primeiro)
  return [...normalizedIncomes, ...normalizedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
};