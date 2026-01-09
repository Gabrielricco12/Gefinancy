import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        // MUDANÇA CRÍTICA: getUser() vai no servidor validar. 
        // getSession() apenas confia no localStorage.
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          // Se der erro (usuário deletado ou token inválido), limpamos tudo
          console.warn("Sessão inválida ou usuário deletado. Deslogando...");
          if (mounted) setUser(null);
          await supabase.auth.signOut(); 
        } else {
          if (mounted) setUser(user);
        }
      } catch (error) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkUser();

    // O Listener continua útil para login/logout explícitos
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        // Se o evento for TOKEN_REFRESHED ou SIGNED_IN, atualizamos
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);