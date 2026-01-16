
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, RecurrenceType } from '../types';
import { Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, Repeat, ChevronDown, AlertTriangle, X, CalendarDays, Layers } from 'lucide-react';
import { MONTHS, RECURRENCE_LABELS } from '../constants';
import { Icon } from './ui/Icons';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: number;
  currentYear: number;
  onAdd: (data: any) => void;
  onEdit: (id: string, data: Partial<Transaction>) => void;
  onDelete: (id: string, deleteAllRecurrence?: boolean) => void;
  onNavigate: (month: number, year: number) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ 
  transactions, 
  categories, 
  currentMonth, 
  currentYear, 
  onAdd, 
  onEdit, 
  onDelete,
  onNavigate 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const [formData, setFormData] = useState({
    type: TransactionType.PAYABLE,
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    recurrence: RecurrenceType.NONE,
    status: TransactionStatus.PENDING,
    installmentsCount: 1,
  });

  useEffect(() => {
    const currentCategory = categories.find(c => c.id === formData.categoryId);
    if (!currentCategory || currentCategory.type !== formData.type) {
      const firstValid = categories.find(c => c.type === formData.type);
      if (firstValid) {
        setFormData(prev => ({ ...prev, categoryId: firstValid.id }));
      }
    }
  }, [formData.type, categories]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const date = new Date(t.dueDate);
        const isCurrentPeriod = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
        return isCurrentPeriod && matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [transactions, currentMonth, currentYear, search, typeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Por favor, selecione uma categoria.");
      return;
    }
    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }
    closeModal();
  };

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingId(transaction.id);
      setFormData({
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
        dueDate: transaction.dueDate,
        categoryId: transaction.categoryId,
        recurrence: RecurrenceType.NONE, 
        status: transaction.status,
        installmentsCount: 1,
      });
    } else {
      setEditingId(null);
      const defaultCategory = categories.find(c => c.type === TransactionType.PAYABLE)?.id || '';
      setFormData({
        type: TransactionType.PAYABLE,
        description: '',
        amount: 0,
        dueDate: new Date().toISOString().split('T')[0],
        categoryId: defaultCategory,
        recurrence: RecurrenceType.NONE,
        status: TransactionStatus.PENDING,
        installmentsCount: 1,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusClass = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PAID:
      case TransactionStatus.RECEIVED: return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
      case TransactionStatus.OVERDUE: return 'bg-rose-50 text-rose-700 hover:bg-rose-100';
      default: return 'bg-amber-50 text-amber-700 hover:bg-amber-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <button type="button" onClick={() => onNavigate(currentMonth === 0 ? 11 : currentMonth - 1, currentMonth === 0 ? currentYear - 1 : currentYear)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm font-black text-slate-700 min-w-[140px] text-center uppercase tracking-tight">
            {MONTHS[currentMonth]} {currentYear}
          </div>
          <button type="button" onClick={() => onNavigate(currentMonth === 11 ? 0 : currentMonth + 1, currentMonth === 11 ? currentYear + 1 : currentYear)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 w-full text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            type="button"
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-black transition-all shadow-lg active:scale-95 text-xs font-black uppercase tracking-widest"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">Nenhum lançamento encontrado para este período.</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${t.type === TransactionType.PAYABLE ? 'bg-rose-500 shadow-lg shadow-rose-500/30' : 'bg-emerald-500 shadow-lg shadow-emerald-500/30'}`}></div>
                        <div>
                          <p className="font-bold text-slate-800">{t.description}</p>
                          {t.recurrenceId && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                              <Repeat size={10} /> Parcela {t.installment}/{t.totalInstallments}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">
                           <Icon name={categories.find(c => c.id === t.categoryId)?.icon || 'Tag'} size={12} />
                         </div>
                         <span className="text-xs font-bold text-slate-600">
                           {categories.find(c => c.id === t.categoryId)?.name || 'Outros'}
                         </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-black ${t.type === TransactionType.PAYABLE ? 'text-slate-800' : 'text-emerald-600'}`}>
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-none outline-none cursor-pointer ${getStatusClass(t.status)}`}
                          value={t.status}
                          onChange={(e) => onEdit(t.id, { status: e.target.value as TransactionStatus })}
                        >
                          <option value={TransactionStatus.PENDING}>Pendente</option>
                          <option value={t.type === TransactionType.PAYABLE ? TransactionStatus.PAID : TransactionStatus.RECEIVED}>
                            {t.type === TransactionType.PAYABLE ? 'Pago' : 'Recebido'}
                          </option>
                          <option value={TransactionStatus.OVERDUE}>Atrasado</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={14} /></button>
                        <button 
                          onClick={() => {
                            if(t.recurrenceId) {
                              setDeletingTransaction(t);
                            } else if(window.confirm('Deseja realmente excluir este lançamento?')) {
                              onDelete(t.id);
                            }
                          }} 
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ADIÇÃO/EDIÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editingId ? 'Editar Registro' : 'Novo Lançamento'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:bg-white p-2 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Fluxo de Caixa</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: TransactionType.PAYABLE})}
                    className={`py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-1 ${formData.type === TransactionType.PAYABLE ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    Despesa (Saída)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: TransactionType.RECEIVABLE})}
                    className={`py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-1 ${formData.type === TransactionType.RECEIVABLE ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    Receita (Entrada)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descrição do Lançamento</label>
                  <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-slate-700" placeholder="Ex: Supermercado, Aluguel, Salário..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Valor {formData.installmentsCount > 1 ? 'Total' : ''} (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-800 text-lg" placeholder="0,00" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data de Vencimento</label>
                  <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 appearance-none cursor-pointer"
                      value={formData.categoryId}
                      onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    >
                      {categories.filter(c => c.type === formData.type).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE REPETIÇÃO - APENAS PARA NOVOS LANÇAMENTOS */}
              {!editingId && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={16} className="text-blue-500" />
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">Repetição e Planejamento</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Recorrência</label>
                      <div className="relative">
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-600 appearance-none cursor-pointer text-sm"
                          value={formData.recurrence}
                          onChange={e => setFormData({...formData, recurrence: e.target.value as RecurrenceType})}
                        >
                          <option value={RecurrenceType.NONE}>Nenhuma</option>
                          <option value={RecurrenceType.MONTHLY}>Mensal</option>
                          <option value={RecurrenceType.QUARTERLY}>Trimestral</option>
                          <option value={RecurrenceType.SEMIANNUAL}>Semestral</option>
                          <option value={RecurrenceType.ANNUAL}>Anual</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Parcelamento (1x até 12x)</label>
                      <div className="relative">
                        <select 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-600 appearance-none cursor-pointer text-sm"
                          value={formData.installmentsCount}
                          onChange={e => setFormData({...formData, installmentsCount: parseInt(e.target.value)})}
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                            <option key={num} value={num}>{num}x {num > 1 ? `(Parcelado)` : '(À vista)'}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                      </div>
                    </div>
                  </div>
                  
                  {formData.installmentsCount > 1 && (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <AlertTriangle size={14} className="shrink-0" />
                      <p className="text-[10px] font-bold uppercase leading-tight">
                        O valor total de {formatCurrency(formData.amount)} será dividido em {formData.installmentsCount} parcelas de {formatCurrency(formData.amount / formData.installmentsCount)}.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">Confirmar Lançamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE RECORRÊNCIA */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Excluir Lançamento</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Este lançamento faz parte de uma série (parcelamento). Como deseja prosseguir?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => { onDelete(deletingTransaction.id); setDeletingTransaction(null); }}
                  className="w-full py-3 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                >
                  Excluir apenas este
                </button>
                <button 
                  onClick={() => { onDelete(deletingTransaction.id, true); setDeletingTransaction(null); }}
                  className="w-full py-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                >
                  Excluir toda a série
                </button>
                <button 
                  onClick={() => setDeletingTransaction(null)}
                  className="w-full py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
