import { supabase } from '../../lib/supabase';

export async function getDashboardData(userId, startOfMonthDate, endOfMonthDate) {
  // 1. Transações do Mês (Para lista e cards pequenos)
  const monthlyPromise = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, slug, type),
      account:accounts(id, name)
    `)
    .eq('user_id', userId)
    .gte('date', startOfMonthDate)
    .lte('date', endOfMonthDate)
    .order('date', { ascending: false });

  // 2. Histórico TOTAL (Para calcular o saldo atual real)
  const historyPromise = supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId);

  // 3. Contas (Para pegar o saldo inicial)
  const accountsPromise = supabase
    .from('accounts')
    .select('initial_balance')
    .eq('user_id', userId);

  const [monthlyRes, historyRes, accountsRes] = await Promise.all([
    monthlyPromise,
    historyPromise,
    accountsPromise
  ]);

  if (monthlyRes.error) throw monthlyRes.error;
  if (historyRes.error) throw historyRes.error;
  if (accountsRes.error) throw accountsRes.error;

  return {
    monthlyTransactions: monthlyRes.data,
    allHistory: historyRes.data,
    accounts: accountsRes.data
  };
}