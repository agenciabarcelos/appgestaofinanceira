
import React, { useState, useMemo } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { Plus, Trash2, Edit2, Tag, PieChart, Info, Eraser, Loader2 } from 'lucide-react';
import { Icon } from './ui/Icons';

interface CategoriesProps {
  categories: Category[];
  transactions: Transaction[];
  onAdd: (name: string, type: TransactionType) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ categories, transactions, onAdd, onEdit, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: TransactionType.PAYABLE });
  const [isCleaning, setIsCleaning] = useState(false);

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    
    transactions.forEach(t => {
      if (!stats[t.categoryId]) {
        stats[t.categoryId] = { count: 0, total: 0 };
      }
      stats[t.categoryId].count += 1;
      stats[t.categoryId].total += t.amount;
    });
    
    return stats;
  }, [transactions]);

  const emptyCategories = useMemo(() => {
    return categories.filter(cat => {
      const stat = categoryStats[cat.id] || { count: 0 };
      return stat.count === 0;
    });
  }, [categories, categoryStats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit(editingId, formData.name);
    } else {
      onAdd(formData.name, formData.type);
    }
    setFormData({ name: '', type: TransactionType.PAYABLE });
    setEditingId(null);
    setShowModal(false);
  };

  const handleCleanup = async () => {
    if (emptyCategories.length === 0) {
      alert("Nenhuma categoria vazia encontrada para remoção.");
      return;
    }

    const confirm = window.confirm(
      `Existem ${emptyCategories.length} categorias sem nenhum lançamento vinculado. Deseja removê-las permanentemente do banco de dados?`
    );

    if (confirm) {
      setIsCleaning(true);
      try {
        // Removemos uma a uma para garantir a integridade das chamadas de API
        for (const cat of emptyCategories) {
          await onDelete(cat.id);
        }
        alert("Limpeza concluída com sucesso!");
      } catch (error) {
        console.error("Erro durante a limpeza:", error);
      } finally {
        setIsCleaning(false);
      }
    }
  };

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({ name: cat.name, type: cat.type });
    } else {
      setEditingId(null);
      setFormData({ name: '', type: TransactionType.PAYABLE });
    }
    setShowModal(true);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderCategoryList = (type: TransactionType, label: string, colorClass: string, iconBg: string) => (
    <div className="flex-1">
      <h3 className={`text-xs font-black uppercase tracking-widest mb-6 ${colorClass} flex items-center gap-2`}>
        {type === TransactionType.PAYABLE ? <PieChart size={14} /> : <Tag size={14} />}
        {label}
      </h3>
      <div className="space-y-3">
        {categories.filter(c => c.type === type).length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center">
            <p className="text-slate-400 text-sm italic font-medium">Nenhuma categoria cadastrada</p>
          </div>
        ) : (
          categories.filter(c => c.type === type).map(cat => {
            const stat = categoryStats[cat.id] || { count: 0, total: 0 };
            return (
              <div key={cat.id} className="group bg-white rounded-[1.5rem] border border-slate-100 p-4 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon name={cat.icon} size={18} />
                    </div>
                    <div>
                      <span className="font-black text-slate-800 tracking-tight">{cat.name}</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {stat.count} lançamento{stat.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(cat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => onDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                {stat.count > 0 && (
                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Acumulado</span>
                    <span className={`text-sm font-black ${type === TransactionType.PAYABLE ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(stat.total)}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <PieChart size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Estrutura de Categorias</h2>
            <p className="text-blue-100 text-sm font-medium max-w-md">Gerencie como seu dinheiro é classificado. Acompanhe os totais por categoria baseados em todos os seus lançamentos.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleCleanup}
              disabled={isCleaning || emptyCategories.length === 0}
              className="flex items-center justify-center gap-2 bg-blue-500/30 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500/50 transition-all border border-blue-400/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remover categorias sem lançamentos"
            >
              {isCleaning ? <Loader2 size={18} className="animate-spin" /> : <Eraser size={18} />}
              Limpar Vazias ({emptyCategories.length})
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
            >
              <Plus size={18} />
              Nova Categoria
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {renderCategoryList(TransactionType.PAYABLE, 'Categorias de Saída', 'text-rose-500', 'bg-rose-50 text-rose-500')}
        {renderCategoryList(TransactionType.RECEIVABLE, 'Categorias de Entrada', 'text-emerald-500', 'bg-emerald-50 text-emerald-500')}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:bg-white p-2 rounded-full transition-all">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <Info size={18} className="text-amber-600 shrink-0" />
                <p className="text-[11px] font-bold text-amber-700 uppercase leading-relaxed">As categorias ajudam a organizar seus relatórios e dashboards dinâmicos.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome da Categoria</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                  placeholder="Ex: Assinaturas de Streaming"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Fluxo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: TransactionType.PAYABLE})}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${formData.type === TransactionType.PAYABLE ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: TransactionType.RECEIVABLE})}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${formData.type === TransactionType.RECEIVABLE ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                    >
                      Receita
                    </button>
                  </div>
                </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95">Salvar Categoria</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
