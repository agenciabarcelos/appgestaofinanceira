
import React, { useMemo } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction, TransactionType, TransactionStatus, Category } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, CalendarRange, ArrowUpRight, ArrowDownLeft, PieChart as PieIcon } from 'lucide-react';
import { Icon } from './ui/Icons';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: number;
  currentYear: number;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, currentMonth, currentYear }) => {
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.dueDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  }, [transactions, currentMonth, currentYear]);

  // Lógica para filtrar apenas a semana atual (Segunda a Domingo)
  const weeklyTransactions = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Dom) a 6 (Sab)
    
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return transactions
      .filter(t => {
        const d = new Date(t.dueDate);
        const dateObj = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        return dateObj >= monday && dateObj <= sunday;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [transactions]);

  const totals = useMemo(() => {
    const payable = filteredData
      .filter(t => t.type === TransactionType.PAYABLE && t.status !== TransactionStatus.PAID)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const receivable = filteredData
      .filter(t => t.type === TransactionType.RECEIVABLE && t.status !== TransactionStatus.RECEIVED)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const allIncomes = filteredData.filter(t => t.type === TransactionType.RECEIVABLE).reduce((acc, curr) => acc + curr.amount, 0);
    const allExpenses = filteredData.filter(t => t.type === TransactionType.PAYABLE).reduce((acc, curr) => acc + curr.amount, 0);

    return { payable, receivable, balance: allIncomes - allExpenses };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const categoryTotals: Record<string, { name: string; value: number; icon: string }> = {};
    let totalVolume = 0;

    filteredData.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      if (cat) {
        if (!categoryTotals[cat.id]) {
          categoryTotals[cat.id] = { name: cat.name, value: 0, icon: cat.icon };
        }
        categoryTotals[cat.id].value += t.amount;
        totalVolume += t.amount;
      }
    });

    return Object.entries(categoryTotals)
      .map(([id, data]) => ({
        id,
        ...data,
        percentage: totalVolume > 0 ? (data.value / totalVolume) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, categories]);

  const typeData = useMemo(() => [
    { name: 'Receitas', value: filteredData.filter(t => t.type === TransactionType.RECEIVABLE).reduce((a, b) => a + b.amount, 0), color: '#10b981' },
    { name: 'Despesas', value: filteredData.filter(t => t.type === TransactionType.PAYABLE).reduce((a, b) => a + b.amount, 0), color: '#ef4444' }
  ], [filteredData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getDayLabel = (dateString: string) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const d = new Date(dateString);
    const dateObj = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return days[dateObj.getDay()];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Restante a Receber</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totals.receivable)}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Total pendente no mês</p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Restante a Pagar</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totals.payable)}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Total em aberto no mês</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-900/10 group transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saldo Previsto</span>
            <div className="p-2 bg-blue-600 rounded-xl text-white group-hover:rotate-12 transition-transform">
              <DollarSign size={20} />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${totals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totals.balance)}
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Diferença total entradas/saídas</p>
        </div>
      </div>

      {/* Agenda da Semana */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CalendarRange size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fluxo da Semana</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compromissos de Segunda a Domingo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weeklyTransactions.length > 0 ? (
            weeklyTransactions.map((t) => (
              <div key={t.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <div className={`flex flex-col items-center justify-center min-w-[50px] py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter ${t.type === TransactionType.RECEIVABLE ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  <span>{getDayLabel(t.dueDate)}</span>
                  <span className="text-lg leading-none">{new Date(t.dueDate).getUTCDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{t.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {t.type === TransactionType.RECEIVABLE ? <ArrowUpRight size={10} className="text-emerald-500" /> : <ArrowDownLeft size={10} className="text-rose-500" />}
                    <span className="text-xs font-black text-slate-600 tracking-tight">{formatCurrency(t.amount)}</span>
                  </div>
                </div>
                {t.status === TransactionStatus.PAID || t.status === TransactionStatus.RECEIVED ? (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <Calendar className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Nenhum compromisso financeiro para esta semana</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infográfico de Volume por Categoria - NOVO MODELO */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Volume por Categoria
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              Filtro Mensal
            </span>
          </div>
          
          <div className="flex-1 space-y-5">
            {chartData.length > 0 ? (
              chartData.map((item, index) => (
                <div key={item.id} className="group relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Icon name={item.icon} size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] md:max-w-none">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-800 group-hover:scale-105 transition-transform">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md min-w-[45px] text-center">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Barra de Progresso Infográfica */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                      style={{ 
                        width: `${item.percentage}%`,
                        opacity: 1 - (index * 0.12) // Gradiente visual opcional
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <PieIcon className="text-slate-200 mb-3" size={48} />
                <p className="text-xs font-bold uppercase tracking-widest italic">Sem dados para análise</p>
              </div>
            )}
          </div>
        </div>

        {/* Proporção Receita vs Despesa */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-black mb-8 text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
            Equilíbrio Mensal
          </h3>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center">
            {typeData.some(d => d.value > 0) ? (
              <>
                <div className="flex-1 h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} 
                        formatter={(value: number) => formatCurrency(value)} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3 mt-6 md:mt-0 md:ml-8 w-full md:w-auto">
                   {typeData.map((d, i) => (
                     <div key={i} className="flex items-center justify-between md:justify-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all">
                       <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                       </div>
                       <span className="text-sm font-black text-slate-800">{formatCurrency(d.value)}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col items-center justify-center text-slate-400 py-12">
                <TrendingUp className="text-slate-200 mb-3" size={48} />
                <p className="text-xs font-bold uppercase tracking-widest italic">Aguardando lançamentos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
