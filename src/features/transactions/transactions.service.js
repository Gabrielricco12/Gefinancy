import { supabase } from '../../lib/supabase';
import { addMonths } from 'date-fns';

/**
 * Cria uma NOVA DESPESA com parcelas
 */
export const createExpense = async ({
  userId,
  accountId,
  creditCardId, // <--- ADICIONADO
  categoryId,
  amount,
  description,
  date,
  firstPaymentDate,
  installments = 1,
  paymentMethod // <--- ADICIONADO
}) => {
  const purchaseDate = new Date(date);
  const startDate = firstPaymentDate ? new Date(firstPaymentDate) : purchaseDate;
  
  const installmentValue = amount / installments;

  // 1. Inserir o PAI (A Despesa Global)
  // Agora passamos account_id, credit_card_id e payment_method corretamente
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: categoryId,
      description,
      total_amount: amount,
      purchase_date: date, 
      total_installments: installments,
      account_id: accountId || null,          // <--- CORREÇÃO
      credit_card_id: creditCardId || null,   // <--- CORREÇÃO
      payment_method: paymentMethod           // <--- CORREÇÃO
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  // 2. Preparar as FILHAS (As Parcelas)
  const installmentsPayload = [];

  for (let i = 0; i < installments; i++) {
    const dueDate = addMonths(startDate, i);
    
    installmentsPayload.push({
      user_id: userId,
      expense_id: expense.id,
      account_id: accountId, // Vincula parcelas à conta se for débito/pix
      parcel_number: i + 1,
      amount: installmentValue,
      due_date: dueDate.toISOString(),
      status: paymentMethod === 'credit_card' ? 'pending' : 'paid' // Débito/Pix já nasce pago
    });
  }

  // 3. Inserir as Parcelas
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
 */
export const getStatement = async (userId, startDate, endDate) => {
  // 1. Buscar Rendas (Sem filtro de user_id explícito para suportar Família)
  const { data: incomes } = await supabase
    .from('incomes')
    .select(`*, categories(name, slug)`)
    .gte('date', startDate)
    .lte('date', endDate);

  // 2. Buscar Parcelas
  const { data: installmentsDeep } = await supabase
    .from('installments')
    .select(`
      id, amount, due_date, status, parcel_number, user_id,
      expenses!inner (
        description,
        categories (name, slug)
      )
    `)
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
    status: i.received ? 'paid' : 'pending',
    user_id: i.user_id // Importante para o badge "Criado por..."
  }));

  // 4. Normalizar Despesas
  const normalizedExpenses = (installmentsDeep || []).map(i => ({
    id: i.id,
    type: 'expense',
    description: `${i.expenses.description} (${i.parcel_number}x)`,
    amount: i.amount,
    date: i.due_date,
    category: i.expenses.categories,
    status: i.status,
    user_id: i.user_id // Importante para o badge "Criado por..."
  }));

  // 5. Unificar
  return [...normalizedIncomes, ...normalizedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
};