import { supabase } from '../../lib/supabase';

export const CategoriesService = {
  /**
   * Busca todas as categorias (Próprias + Família)
   */
  async getAll(userId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      // .eq('user_id', userId) <--- REMOVIDO
    
    if (error) throw error;
    return data;
  },

  /**
   * Cria nova categoria
   */
  async create({ userId, name, type }) {
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name,
        slug, 
        type
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};