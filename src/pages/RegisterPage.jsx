import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmail } from '../features/auth/auth.api';
import { UserPlus, PieChart } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await registerWithEmail({ email, password, firstName, lastName });
      toast.success('Conta criada com sucesso!');
      navigate('/'); 
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar conta', {
        description: 'Verifique os dados ou tente outro email.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-safe pb-safe flex items-center justify-center relative overflow-hidden bg-gray-50">
      <div className="absolute top-[20%] left-[-5%] w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="w-full h-full overflow-y-auto px-6 z-10 flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto p-8 bg-white/30 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
          
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-indigo-600/90 rounded-2xl flex items-center justify-center mb-4 shadow-lg text-white transform -rotate-3">
              <PieChart size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Criar Conta</h1>
            <p className="text-gray-600/80 mt-1 text-sm">Vamos configurar seu perfil</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:bg-white/90 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all placeholder-gray-400 backdrop-blur-sm"
                  placeholder="João"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Sobrenome</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:bg-white/90 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all placeholder-gray-400 backdrop-blur-sm"
                  placeholder="Silva"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:bg-white/90 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all placeholder-gray-400 backdrop-blur-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Senha</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3.5 bg-white/50 border border-white/50 rounded-2xl focus:bg-white/90 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 outline-none transition-all placeholder-gray-400 backdrop-blur-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {loading ? 'Registrando...' : <><UserPlus size={20} /> Começar Agora</>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            Já possui cadastro?{' '}
            <Link to="/login" className="text-indigo-700 font-bold hover:text-indigo-800">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}