import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { CategoriesService } from '../../features/categories/categories.service';
import { X, Plus, Trash2, Tag, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CategoryManagerModal({ onClose }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado do Formulário
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar Categorias
  const loadCategories = async () => {
    try {
      const data = await CategoriesService.getAll(user.id);
      setCategories(data);
    } catch (error) {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadCategories(); }, [user]);

  // Adicionar Categoria
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      await CategoriesService.create({
        userId: user.id,
        name: newCategoryName,
        type: activeTab
      });
      toast.success("Categoria adicionada!");
      setNewCategoryName(''); // Limpa input
      loadCategories();       // Recarrega lista
    } catch (error) {
      toast.error("Erro ao criar categoria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deletar Categoria
  const handleDelete = async (id) => {
    if (!confirm("Remover esta categoria?")) return;
    try {
      await CategoriesService.delete(id);
      toast.success("Categoria removida.");
      loadCategories();
    } catch (error) {
      toast.error("Não é possível remover categorias que já possuem transações.");
    }
  };

  // Filtrar lista atual baseada na aba
  const currentList = categories.filter(c => c.type === activeTab);

  return (
    <div className="bg-white w-full rounded-t-3xl shadow-2xl flex flex-col h-[75vh] pb-16">
      {/* Header */}
      <div className="bg-gray-900 p-6 rounded-t-3xl flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2">
            <Tag size={20} />
            <h2 className="font-bold text-xl">Gerenciar Categorias</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Abas (Tabs) */}
        <div className="flex p-4 gap-2 border-b border-gray-100">
            <button 
                onClick={() => setActiveTab('expense')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'expense' ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-gray-50 text-gray-400'}`}
            >
                <ArrowDownCircle size={16} /> Despesas
            </button>
            <button 
                onClick={() => setActiveTab('income')}
                className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${activeTab === 'income' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200' : 'bg-gray-50 text-gray-400'}`}
            >
                <ArrowUpCircle size={16} /> Receitas
            </button>
        </div>

        {/* Input de Nova Categoria */}
        <form onSubmit={handleAdd} className="p-4 bg-gray-50/50">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder={`Nova categoria de ${activeTab === 'expense' ? 'despesa' : 'receita'}...`}
                    className="flex-1 p-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button 
                    disabled={isSubmitting || !newCategoryName.trim()}
                    className="bg-gray-900 text-white p-3 rounded-xl hover:bg-black disabled:opacity-50 transition shadow-lg shadow-gray-500/20"
                >
                    <Plus size={24} />
                </button>
            </div>
        </form>

        {/* Lista de Categorias */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
                <p className="text-center text-gray-400 mt-4">Carregando...</p>
            ) : currentList.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                    Nenhuma categoria encontrada.
                </div>
            ) : (
                currentList.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <span className="font-medium text-gray-700">{cat.name}</span>
                        <button 
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}