import BottomNav from './BottomNav';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative overflow-hidden flex flex-col">
      
      {/* --- Camada 1: Background Decorativo (Liquid Glass) --- */}
      {/* Blob Azul */}
      <div className="fixed top-[-10%] right-[-20%] w-[300px] h-[300px] bg-blue-200/40 rounded-full blur-3xl pointer-events-none z-0" />
      {/* Blob Roxo */}
      <div className="fixed top-[10%] left-[-10%] w-[200px] h-[200px] bg-purple-200/40 rounded-full blur-3xl pointer-events-none z-0" />

      {/* --- Camada 2: Conteúdo da Página --- */}
      {/* z-10 garante que o conteúdo fique acima do fundo, mas abaixo de modais (z-50+) */}
      <div className="flex-1 z-10 relative flex flex-col w-full max-w-md mx-auto">
        {children}
      </div>

      {/* --- Camada 3: Navegação Fixa --- */}
      <BottomNav />
    </div>
  );
}