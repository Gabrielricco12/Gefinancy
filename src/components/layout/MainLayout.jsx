import { Link, useLocation } from 'react-router-dom';
import { Home, CreditCard, Repeat, User, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDate } from '../../features/date/DateContext'; // Importar o contexto
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Variantes de animação
const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { zIndex: 1, x: 0, opacity: 1 },
  exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

export default function MainLayout({ children }) {
  const location = useLocation();
  const { currentDate, nextMonth, prevMonth, direction, page } = useDate(); // Usar dados globais

  // Formatação do Mês no Header
  const formattedDate = format(currentDate, "MMMM yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const navItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: CreditCard, label: 'Transações', path: '/transactions' },
    { icon: Repeat, label: 'Fixas', path: '/fixed-expenses' },
   
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* 1. Header Global de Navegação de Mês */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 pt-safe border-b border-gray-100">
        <div className="px-6 py-3 flex items-center justify-between">
           <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-blue-600 transition">
            
           </button>
           
           <div className="flex flex-col items-center">
             <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
               <CalendarRange size={16} className="text-blue-600" />
               {capitalizedDate}
             </span>
           </div>

           <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-blue-600 transition">
             
           </button>
        </div>
      </div>

      {/* 2. Área de Conteúdo com Swipe Global */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page} // A chave muda quando o mês muda, disparando a animação
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) nextMonth();
              else if (swipe > swipeConfidenceThreshold) prevMonth();
            }}
            className="flex-1 flex flex-col w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Bottom Navigation (Fixo, não anima) */}
      <nav className="bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-30">
        <ul className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link to={item.path} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${isActive ? 'text-blue-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600'}`}>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-medium ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{item.label}</span>
                  {isActive && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-blue-600 rounded-full absolute -bottom-1" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}