import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../features/auth/auth.api';
import { LogIn, Wallet } from 'lucide-react';
import { toast } from 'sonner'; // Importar toast

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await loginWithEmail({ email, password });
      toast.success('Login realizado com sucesso!'); // Feedback positivo
      navigate('/');
    } catch (err) {
      console.error(err);
      // Feedback de erro elegante
      toast.error('Falha ao entrar', {
        description: 'Verifique suas credenciais e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-safe pb-safe flex flex-col items-center justify-center relative overflow-hidden bg-gray-50">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full h-full overflow-y-auto px-6 z-10 flex flex-col justify-center">
        <div className="w-full max-w-sm mx-auto p-8 bg-white/30 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
          
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-blue-600/90 rounded-2xl flex items-center justify-center mb-4 shadow-lg text-white transform rotate-3">
              <Wallet size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Bem-vindo</h1>
            <p className="text-gray-600/80 mt-1 text-sm">Controle financeiro pessoal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:bg-white/90 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none transition-all placeholder-gray-400 text-gray-800 backdrop-blur-sm shadow-sm"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Senha</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:bg-white/90 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 outline-none transition-all placeholder-gray-400 text-gray-800 backdrop-blur-sm shadow-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {loading ? 'Entrando...' : <><LogIn size={20} /> Entrar</>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            Novo por aqui?{' '}
            <Link to="/register" className="text-blue-700 font-bold hover:text-blue-800">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}