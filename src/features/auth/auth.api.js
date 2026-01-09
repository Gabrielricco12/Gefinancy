import { supabase } from '../../lib/supabase';

/**
 * Realiza o login com email e senha
 */
export const loginWithEmail = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

/**
 * Registra novo usuário enviando metadados para criação do Profile
 */
export const registerWithEmail = async ({ email, password, firstName, lastName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Estes dados são salvos em raw_user_meta_data no auth.users
      // O Trigger handle_new_user (SQL) vai ler daqui para popular a tabela profiles
      data: { 
        first_name: firstName, 
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim() // Útil para emails de sistema ou fallback
      },
    },
  });
  
  if (error) throw error;
  return data;
};

/**
 * Desloga o usuário
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Busca o usuário atual validando a sessão no servidor (mais seguro que getSession)
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
};