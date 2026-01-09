import { supabase } from '../../lib/supabase';

export const AccountsService = {
  /**
   * Busca todas as contas e seus cartões vinculados
   */
  async getAllWithCards(userId) {
    // 1. Busca Contas
    const { data: accounts, error: accError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    
    if (accError) throw accError;

    // 2. Busca Cartões
    const { data: cards, error: cardError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId);

    if (cardError) throw cardError;

    // 3. Unifica os dados
    return accounts.map(acc => ({
      ...acc,
      cards: cards.filter(c => c.account_id === acc.id)
    }));
  },

  /**
   * Cria APENAS Conta Bancária
   * CORREÇÃO: Removemos o envio de 'type', pois a coluna não existe mais no banco
   */
  async createAccount({ userId, name, balance }) {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        name,
        balance: balance || 0
        // REMOVIDO: type: 'checking' (Isso causava o erro 400)
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