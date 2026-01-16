
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { MONTHS } from '../constants';

interface ReportsProps {
  transactions: Transaction[];
  categories: Category[];
}

const Reports: React.FC<ReportsProps> = ({ transactions, categories }) => {
  const [period, setPeriod] = useState<string>('MONTH');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Gerar lista de anos (5 anos atrás até 2 no futuro)
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const arr = [];
    for (let i = current - 5; i <= current + 2; i++) {
      arr.push(i);
    }
    return arr.sort((a, b) => b - a);
  }, []);

  const reportData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();

    return transactions
      .filter(t => {
        const date = new Date(t.dueDate);
        const isYear = date.getFullYear() === selectedYear;
        if (!isYear) return false;

        const tMonth = date.getMonth();

        // Lógica para as opções fixas
        if (period === 'MONTH') {
          return tMonth === currentMonth;
        } else if (period === 'QUARTER') {
          const currentQuarter = Math.floor(currentMonth / 3);
          const tQuarter = Math.floor(tMonth / 3);
          return currentQuarter === tQuarter;
        } else if (period === 'SEMIANNUAL') {
          const currentSemester = Math.floor(currentMonth / 6);
          const tSemester = Math.floor(tMonth / 6);
          return currentSemester === tSemester;
        } else if (period === 'YEAR') {
          return true;
        } 
        
        // Lógica para meses individuais (0 a 11)
        const monthIndex = parseInt(period);
        if (!isNaN(monthIndex)) {
          return tMonth === monthIndex;
        }

        return true;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [transactions, period, selectedYear]);

  const incomes = useMemo(() => reportData.filter(t => t.type === TransactionType.RECEIVABLE), [reportData]);
  const expenses = useMemo(() => reportData.filter(t => t.type === TransactionType.PAYABLE), [reportData]);

  const summary = useMemo(() => {
    const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
    const totalIncomes = incomes.reduce((a, b) => a + b.amount, 0);
    return { totalExpenses, totalIncomes, total: totalIncomes - totalExpenses };
  }, [expenses, incomes]);

  const exportToCSV = () => {
    const headers = ['Data', 'Descricao', 'Categoria', 'Tipo', 'Valor', 'Status'];
    const rows = reportData.map(t => [
      t.dueDate,
      t.description,
      categories.find(c => c.id === t.categoryId)?.name || 'Outros',
      t.type === TransactionType.PAYABLE ? 'Despesa' : 'Receita',
      t.amount.toFixed(2),
      t.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${period.toLowerCase()}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderTable = (data: Transaction[], title: string, colorClass: string, headerColor: string) => (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
      <div className={`p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 ${colorClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${headerColor}`}></div>
          <h3 className="font-black text-slate-800 uppercase tracking-tight">{title} ({data.length})</h3>
        </div>
        <span className="font-black text-slate-800 bg-white/50 px-4 py-2 rounded-xl border border-white">
          Total: {formatCurrency(data.reduce((acc, curr) => acc + curr.amount, 0))}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 font-bold border-b border-slate-100">
              <th className="px-6 py-4 uppercase tracking-tighter text-[10px]">Data</th>
              <th className="px-6 py-4 uppercase tracking-tighter text-[10px]">Descrição</th>
              <th className="px-6 py-4 uppercase tracking-tighter text-[10px]">Categoria</th>
              <th className="px-6 py-4 uppercase tracking-tighter text-[10px]">Valor</th>
              <th className="px-6 py-4 uppercase tracking-tighter text-[10px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-500">{new Date(t.dueDate).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{t.description}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-500 font-bold text-[10px] uppercase">
                    {categories.find(c => c.id === t.categoryId)?.name || 'Outros'}
                  </span>
                </td>
                <td className={`px-6 py-4 font-black ${t.type === TransactionType.RECEIVABLE ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${t.type === TransactionType.PAYABLE ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic font-medium">
                  Nenhum registro encontrado para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner">
            <FileText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Relatórios Analíticos</h2>
            <p className="text-sm text-slate-400 font-medium">Filtre seus lançamentos por ano e períodos específicos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <Calendar size={18} className="ml-2 text-slate-400" />
             <select 
               className="bg-transparent border-none text-sm font-black text-slate-700 outline-none pr-4 cursor-pointer"
               value={selectedYear}
               onChange={(e) => setSelectedYear(parseInt(e.target.value))}
             >
               {years.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <Filter size={18} className="ml-2 text-slate-400" />
             <select 
               className="bg-transparent border-none text-sm font-black text-slate-700 outline-none pr-4 cursor-pointer"
               value={period}
               onChange={(e) => setPeriod(e.target.value)}
             >
               <optgroup label="Agrupamentos Especiais">
                 <option value="MONTH">Mensal (Mês Atual)</option>
                 <option value="QUARTER">Trimestral (Trimestre Atual)</option>
                 <option value="SEMIANNUAL">Semestral (Semestre Atual)</option>
                 <option value="YEAR">Anual (Ano Inteiro)</option>
               </optgroup>
               <optgroup label="Meses do Ano">
                 {MONTHS.map((m, idx) => (
                   <option key={m} value={idx}>{m}</option>
                 ))}
               </optgroup>
             </select>
          </div>

          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95 ml-auto lg:ml-0"
          >
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 shadow-sm group hover:scale-[1.02] transition-transform">
          <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2">Total Receitas</p>
          <p className="text-3xl font-black text-emerald-900">{formatCurrency(summary.totalIncomes)}</p>
        </div>
        <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 shadow-sm group hover:scale-[1.02] transition-transform">
          <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest mb-2">Total Despesas</p>
          <p className="text-3xl font-black text-rose-900">{formatCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl shadow-indigo-600/20 group hover:scale-[1.02] transition-transform">
          <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mb-2">Saldo Líquido</p>
          <p className={`text-3xl font-black text-white`}>
            {formatCurrency(summary.total)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {renderTable(incomes, 'Detalhamento de Entradas', 'bg-emerald-50/40', 'bg-emerald-500')}
        {renderTable(expenses, 'Detalhamento de Saídas', 'bg-rose-50/40', 'bg-rose-500')}
      </div>
    </div>
  );
};

export default Reports;
