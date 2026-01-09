import { supabase } from '../../lib/supabase';

export const FixedExpensesService = {
  /**
   * Busca todas as despesas fixas ativas do usuário
   * Retorna ordenado pelo dia de vencimento
   */
  async getAll(userId) {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select(`
        *,
        categories (id, name, slug, type)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('due_day', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Cria uma nova despesa fixa
   * Suporta recorrência infinita (totalMonths = null) ou finita (totalMonths = numero)
   */
  async create({ userId, categoryId, description, amount, dueDay, startDate, totalMonths }) {
    // Objeto base
    const payload = {
      user_id: userId,
      category_id: categoryId,
      description,
      amount,
      due_day: dueDay,
      start_date: startDate, // Nova coluna obrigatória (default current_date no banco, mas bom enviar)
      is_active: true
    };

    // Lógica de Recorrência:
    // Se totalMonths for um número válido > 0, salvamos.
    // Se não (undefined, null, 0), enviamos NULL explicitamente para ser Infinito.
    if (totalMonths && parseInt(totalMonths) > 0) {
      payload.total_months = parseInt(totalMonths);
    } else {
      payload.total_months = null;
    }

    const { data, error } = await supabase
      .from('fixed_expenses')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualiza uma despesa fixa existente
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove uma despesa fixa (Hard Delete)
   */
  async delete(id) {
    const { error } = await supabase
      .from('fixed_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};