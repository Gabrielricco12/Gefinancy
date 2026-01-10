import { supabase } from '../../lib/supabase';
import { addMonths, isSameMonth, parseISO, setDate, isValid, isAfter, isBefore, addDays } from 'date-fns';

/**
 * Cria uma NOVA DESPESA com parcelas
 */
export const createExpense = async ({
  userId,
  accountId,
  creditCardId,
  categoryId,
  amount,
  description,
  date,
  firstPaymentDate,
  installments = 1,
  paymentMethod
}) => {
  const purchaseDate = new Date(date);
  const startDate = firstPaymentDate ? new Date(firstPaymentDate) : purchaseDate;
  
  const installmentValue = amount / installments;

  // 1. Inserir o PAI
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: categoryId,
      description,
      total_amount: amount,
      purchase_date: date, 
      total_installments: installments,
      account_id: accountId || null,
      credit_card_id: creditCardId || null,
      payment_method: paymentMethod
    })
    .select()
    .single();

  if (expenseError) throw expenseError;

  // 2. Preparar Parcelas
  const installmentsPayload = [];

  for (let i = 0; i < installments; i++) {
    const dueDate = addMonths(startDate, i);
    
    installmentsPayload.push({
      user_id: userId,
      expense_id: expense.id,
      account_id: accountId, 
      parcel_number: i + 1,
      amount: installmentValue,
      due_date: dueDate.toISOString(),
      status: paymentMethod === 'credit_card' ? 'pending' : 'paid'
    });
  }

  // 3. Inserir
  const { error: installError } = await supabase
    .from('installments')
    .insert(installmentsPayload);

  if (installError) {
    await supabase.from('expenses').delete().eq('id', expense.id);
    throw installError;
  }

  return expense;
};

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

export const deleteTransaction = async (id, type) => {
  // Se for despesa fixa, deletamos da tabela correta
  if (type === 'fixed') {
     const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
     if (error) throw error;
     return;
  }

  const table = type === 'income' ? 'incomes' : 'installments';
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

/**
 * Busca dados unificados para o Dashboard (Extrato)
 * Unifica: Rendas + Parcelas + DESPESAS FIXAS PROJETADAS
 */
export const getStatement = async (userId, startDate, endDate) => {
  // Datas de referência
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);

  // 1. Buscar Rendas
  const incomesPromise = supabase
    .from('incomes')
    .select(`*, categories(name, slug)`)
    .gte('date', startDate)
    .lte('date', endDate);

  // 2. Buscar Parcelas (Despesas variáveis lançadas)
  const installmentsPromise = supabase
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

  // 3. Buscar Despesas Fixas (Para projetar neste mês)
  const fixedPromise = supabase
    .from('fixed_expenses')
    .select(`*, categories(name, slug)`)
    .eq('is_active', true); 
    // Trazemos todas as ativas e filtramos a data no código para garantir precisão

  const [incomesRes, installmentsRes, fixedRes] = await Promise.all([
    incomesPromise, 
    installmentsPromise,
    fixedPromise
  ]);

  if (incomesRes.error) throw incomesRes.error;
  if (installmentsRes.error) throw installmentsRes.error;
  if (fixedRes.error) throw fixedRes.error;

  // --- Processamento ---

  // A. Normalizar Rendas
  const normalizedIncomes = (incomesRes.data || []).map(i => ({
    id: i.id,
    type: 'income',
    description: i.description,
    amount: Number(i.amount),
    date: i.date,
    category: i.categories,
    status: 'paid',
    user_id: i.user_id
  }));

  // B. Normalizar Despesas Variáveis
  const normalizedExpenses = (installmentsRes.data || []).map(i => ({
    id: i.id,
    type: 'expense',
    description: `${i.expenses.description} (${i.parcel_number}x)`,
    amount: Number(i.amount),
    date: i.due_date,
    category: i.expenses.categories,
    status: i.status,
    user_id: i.user_id
  }));

  // C. Projetar Despesas Fixas para este mês
  const projectedFixed = [];
  
  (fixedRes.data || []).forEach(fix => {
    // Data de início da despesa fixa
    const fixStart = parseISO(fix.start_date);
    
    // Calcula a data de vencimento neste mês específico
    // Ex: Se hoje é Janeiro e due_day é 5 -> 05/01/2026
    let currentMonthDue = setDate(startObj, fix.due_day);

    // Verificações de validade:
    // 1. A data projetada não pode ser ANTES do início da despesa fixa
    if (isBefore(currentMonthDue, fixStart)) return;

    // 2. Se a despesa tem fim (total_months), verifica se já passou
    if (fix.total_months) {
      const fixEnd = addMonths(fixStart, fix.total_months);
      if (isAfter(currentMonthDue, fixEnd)) return;
    }

    // 3. Verifica se a data cai dentro do range solicitado (mesmo mês)
    if (isSameMonth(currentMonthDue, startObj)) {
      projectedFixed.push({
        id: fix.id,
        type: 'fixed', // Identificador especial (mas visualmente será expense)
        description: `${fix.description} (Fixa)`,
        amount: Number(fix.amount),
        date: currentMonthDue.toISOString(),
        category: fix.categories,
        status: 'pending', // Assume pendente até o usuário dar baixa (futuro feature)
        user_id: fix.user_id,
        isFixed: true
      });
    }
  });

  // 5. Unificar Tudo
  // Mapeamos 'fixed' para 'expense' na hora de juntar para que o Dashboard some corretamente
  const allFixedAsExpenses = projectedFixed.map(f => ({ ...f, type: 'expense' }));

  return [...normalizedIncomes, ...normalizedExpenses, ...allFixedAsExpenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};