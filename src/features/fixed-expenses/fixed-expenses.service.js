import { supabase } from '../../lib/supabase';

export const FixedExpensesService = {
  /**
   * Busca todas as despesas fixas ativas (Próprias + Família)
   */
  async getAll(userId) {
    const { data, error } = await supabase
      .from('fixed_expenses')
      .select(`
        *,
        categories (id, name, slug, type)
      `)
      .eq('is_active', true)
      .order('due_day', { ascending: true });
      // .eq('user_id', userId) <--- REMOVIDO

    if (error) throw error;
    return data;
  },

  /**
   * Cria uma nova despesa fixa
   */
  async create({ userId, categoryId, description, amount, dueDay, startDate, totalMonths }) {
    const payload = {
      user_id: userId,
      category_id: categoryId,
      description,
      amount,
      due_day: dueDay,
      start_date: startDate, 
      is_active: true
    };

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

  async delete(id) {
    const { error } = await supabase
      .from('fixed_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};