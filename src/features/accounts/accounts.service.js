import { supabase } from '../../lib/supabase';

export const AccountsService = {
  /**
   * Busca todas as contas e seus cartões vinculados.
   * CALCULA O SALDO DINAMICAMENTE (Frontend) somando:
   * Saldo Inicial + Todas as Receitas - Todas as Despesas Pagas
   */
  async getAllWithCards(userId) {
    // 1. Busca Contas (Sem filtro de ID explícito, confiando no RLS da família)
    const { data: accounts, error: accError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at');
    
    if (accError) throw accError;

    // 2. Busca Cartões
    const { data: cards, error: cardError } = await supabase
      .from('credit_cards')
      .select('*');

    if (cardError) throw cardError;

    // 3. Busca Histórico Financeiro para Cálculo (Receitas e Despesas)
    // Buscamos apenas os campos necessários (account_id, amount) para ser leve
    const { data: incomes } = await supabase
      .from('incomes')
      .select('account_id, amount');

    // Buscamos apenas parcelas PAGAS (que efetivamente saíram da conta)
    const { data: paidInstallments } = await supabase
      .from('installments')
      .select('account_id, amount')
      .eq('status', 'paid');

    // 4. Processamento e Cálculo no Frontend
    return accounts.map(acc => {
       // Filtra transações desta conta específica
       const accIncomes = incomes?.filter(i => i.account_id === acc.id) || [];
       const accExpenses = paidInstallments?.filter(i => i.account_id === acc.id) || [];

       // Soma totais
       const totalIncome = accIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
       const totalExpense = accExpenses.reduce((sum, i) => sum + Number(i.amount), 0);
       const initial = Number(acc.initial_balance || 0);

       // Saldo Calculado: Inicial + Entradas - Saídas
       const currentBalance = initial + totalIncome - totalExpense;

       return {
         ...acc,
         balance: currentBalance, // Sobrescreve o valor estático do banco com o calculado
         cards: cards.filter(c => c.account_id === acc.id)
       };
    });
  },

  /**
   * Cria APENAS Conta Bancária
   */
  async createAccount({ userId, name, balance }) {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        name,
        initial_balance: balance || 0, // Salva no initial_balance para referência
        balance: balance || 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Cria APENAS Cartão de Crédito
   */
  async createCard({ userId, accountId, name, limit, closingDay, dueDay }) {
    if (!accountId) throw new Error("Card must be linked to an account");

    const { data, error } = await supabase
      .from('credit_cards')
      .insert({
        user_id: userId,
        account_id: accountId,
        name,
        limit_amount: limit,
        closing_day: closingDay,
        due_day: dueDay
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAccount(id) {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },
  
  async deleteCard(id) {
    const { error } = await supabase.from('credit_cards').delete().eq('id', id);
    if (error) throw error;
  }
};