import { supabase } from '../../lib/supabase';

export const getDashboardData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // 1. Buscamos todas as transações para calcular saldo e mostrar lista
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (name, slug),
      accounts (name)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (txError) throw txError;

  // 2. Buscamos contas para somar o saldo inicial
  const { data: accounts, error: accError } = await supabase
    .from('accounts')
    .select('initial_balance')
    .eq('user_id', user.id);

  if (accError) throw accError;

  return { transactions, accounts };
};