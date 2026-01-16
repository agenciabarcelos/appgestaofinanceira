
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, RecurrenceType } from '../types';
import { Plus, Search, Filter, Trash2, Edit2, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Repeat, ChevronDown, AlertTriangle, X } from 'lucide-react';
import { MONTHS, RECURRENCE_LABELS } from '../constants';

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
  
  // Deletion logic
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    type: TransactionType.PAYABLE,
    description: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    recurrence: RecurrenceType.NONE,
    status: TransactionStatus.PENDING,
  });

  // Atualiza o categoryId padrão quando as categorias carregarem
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
       const firstPayable = categories.find(c => c.type === TransactionType.PAYABLE);
       if (firstPayable) setFormData(prev => ({ ...prev, categoryId: firstPayable.id }));
    }
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const date = new Date(t.dueDate);
        const isCurrentPeriod = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
        return isCurrentPeriod && matchesSearch && matchesType;
      })
      .sort((a, b) => {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [transactions, currentMonth, currentYear, search, typeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Selecione uma categoria válida.");
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
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onNavigate(11, currentYear - 1);
    } else {
      onNavigate(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onNavigate(0, currentYear + 1);
    } else {
      onNavigate(currentMonth + 1, currentYear);
    }
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

  const handleStatusChange = (t: Transaction, newStatus: TransactionStatus) => {
    onEdit(t.id, { status: newStatus });
  };

  const initiateDelete = (t: Transaction) => {
    if (t.recurrenceId) {
      setDeletingTransaction(t);
    } else {
      if (window.confirm(`Deseja excluir "${t.description}"?`)) {
        onDelete(t.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm font-semibold text-slate-700 min-w-[140px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </div>
          <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar lançamento..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
          >
            <option value="ALL">Todos Tipos</option>
            <option value={TransactionType.PAYABLE}>A Pagar</option>
            <option value={TransactionType.RECEIVABLE}>A Receber</option>
          </select>
          <button 
            type="button"
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Novo</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Nenhum lançamento encontrado para este período.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.type === TransactionType.PAYABLE ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                        <div>
                          <p className="font-medium text-slate-800">{t.description}</p>
                          {t.recurrenceId && (
                             <span className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold mt-0.5">
                               <Repeat size={10} /> Parcela {t.installment}/{t.totalInstallments}
                             </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {categories.find(c => c.id === t.categoryId)?.name || 'Outros'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          className={`appearance-none flex items-center gap-1.5 pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold transition-all border-none outline-none cursor-pointer ${getStatusClass(t.status)}`}
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value as TransactionStatus)}
                        >
                          <option value={TransactionStatus.PENDING}>Pendente</option>
                          <option value={t.type === TransactionType.PAYABLE ? TransactionStatus.PAID : TransactionStatus.RECEIVED}>
                            {t.type === TransactionType.PAYABLE ? 'Pago' : 'Recebido'}
                          </option>
                          <option value={TransactionStatus.OVERDUE}>Atrasado</option>
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => openModal(t)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateDelete(t);
                          }} 
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
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

      {/* Delete Confirmation Modal for Recurring */}
      {deletingTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Excluir Lançamento</h2>
              <p className="text-slate-500 text-sm font-medium mb-8 px-4">
                Este item faz parte de uma recorrência. Como deseja prosseguir com a exclusão de <span className="font-bold text-slate-800">"{deletingTransaction.description}"</span>?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onDelete(deletingTransaction.id, false);
                    setDeletingTransaction(null);
                  }}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all uppercase tracking-widest text-xs"
                >
                  Excluir APENAS esta parcela
                </button>
                <button
                  onClick={() => {
                    onDelete(deletingTransaction.id, true);
                    setDeletingTransaction(null);
                  }}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-600/20 uppercase tracking-widest text-xs"
                >
                  Excluir TODA a recorrência
                </button>
                <button
                  onClick={() => setDeletingTransaction(null)}
                  className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase tracking-widest text-[10px]"
                >
                  Manter lançamento (Cancelar)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
              <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Lançamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: TransactionType.PAYABLE, categoryId: categories.find(c => c.type === TransactionType.PAYABLE)?.id || ''})}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all border ${formData.type === TransactionType.PAYABLE ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      A Pagar
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, type: TransactionType.RECEIVABLE, categoryId: categories.find(c => c.type === TransactionType.RECEIVABLE)?.id || ''})}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all border ${formData.type === TransactionType.RECEIVABLE ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      A Receber
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    placeholder="Ex: Aluguel do escritório"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vencimento</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="" disabled>Selecione</option>
                    {categories.filter(c => c.type === formData.type).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Inicial</label>
                  <select 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as TransactionStatus})}
                  >
                    <option value={TransactionStatus.PENDING}>Pendente</option>
                    <option value={formData.type === TransactionType.PAYABLE ? TransactionStatus.PAID : TransactionStatus.RECEIVED}>
                      {formData.type === TransactionType.PAYABLE ? 'Pago' : 'Recebido'}
                    </option>
                    <option value={TransactionStatus.OVERDUE}>Atrasado</option>
                  </select>
                </div>

                {!editingId && (
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recorrência (Gerar próximas parcelas)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(RecurrenceType).map(([key, val]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData({...formData, recurrence: val as RecurrenceType})}
                          className={`py-2 rounded-xl text-[10px] font-bold transition-all border uppercase ${formData.recurrence === val ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}
                        >
                          {RECURRENCE_LABELS[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
