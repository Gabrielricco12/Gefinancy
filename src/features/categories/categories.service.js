import { supabase } from '../../lib/supabase';

export const CategoriesService = {
  /**
   * Busca todas as categorias do usuário
   */
  async getAll(userId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  /**
   * Cria nova categoria
   * Gera o slug automaticamente baseado no nome (ex: "Casa Nova" -> "casa-nova")
   */
  async create({ userId, name, type }) {
    // Slug simples: minúsculo e sem espaços
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name,
        slug, 
        type // 'expense' ou 'income'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove categoria
   */
  async delete(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};