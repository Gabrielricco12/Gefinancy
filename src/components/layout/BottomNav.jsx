import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, Repeat, User } from 'lucide-react'; // Repeat é o ícone de Fixas

export default function BottomNav() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    // Mantive Transações como histórico geral se você tiver essa rota, senão pode ser removido
    { icon: Wallet, label: 'Transações', path: '/transactions' }, 
    { icon: Repeat, label: 'Fixas', path: '/fixed-expenses' }, // NOVA ROTA
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-lg z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              isActive(item.path) ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}