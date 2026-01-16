
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Transaction, TransactionType, TransactionStatus, Category } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

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

  const totals = useMemo(() => {
    // A Pagar: Soma apenas o que NÃO está pago
    const payable = filteredData
      .filter(t => t.type === TransactionType.PAYABLE && t.status !== TransactionStatus.PAID)
      .reduce((acc, curr) => acc + curr.amount, 0);

    // A Receber: Soma apenas o que NÃO foi recebido
    const receivable = filteredData
      .filter(t => t.type === TransactionType.RECEIVABLE && t.status !== TransactionStatus.RECEIVED)
      .reduce((acc, curr) => acc + curr.amount, 0);

    // Saldo Previsto: Diferença de tudo que é receita vs tudo que é despesa no mês (independente de status)
    const allIncomes = filteredData.filter(t => t.type === TransactionType.RECEIVABLE).reduce((acc, curr) => acc + curr.amount, 0);
    const allExpenses = filteredData.filter(t => t.type === TransactionType.PAYABLE).reduce((acc, curr) => acc + curr.amount, 0);

    return { payable, receivable, balance: allIncomes - allExpenses };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const categoryTotals: Record<string, { name: string; value: number }> = {};
    filteredData.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      if (cat) {
        if (!categoryTotals[cat.id]) {
          categoryTotals[cat.id] = { name: cat.name, value: 0 };
        }
        categoryTotals[cat.id].value += t.amount;
      }
    });
    return Object.values(categoryTotals).sort((a, b) => b.value - a.value);
  }, [filteredData, categories]);

  const typeData = useMemo(() => [
    { name: 'Receitas', value: filteredData.filter(t => t.type === TransactionType.RECEIVABLE).reduce((a, b) => a + b.amount, 0), color: '#10b981' },
    { name: 'Despesas', value: filteredData.filter(t => t.type === TransactionType.PAYABLE).reduce((a, b) => a + b.amount, 0), color: '#ef4444' }
  ], [filteredData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Restante a Receber</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totals.receivable)}</div>
          <p className="text-xs text-slate-400 mt-1">Total pendente para este mês</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Restante a Pagar</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totals.payable)}</div>
          <p className="text-xs text-slate-400 mt-1">Total em aberto vencendo este mês</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Saldo do Mês</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className={`text-2xl font-bold ${totals.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(totals.balance)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Diferença total entre entradas e saídas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Volume por Categoria (Mês)</h3>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`#3b82f6`} opacity={1 - (index * 0.1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                Nenhum dado para exibir neste período
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Proporção Receita vs Despesa</h3>
          <div className="h-[300px] flex items-center">
            {typeData.some(d => d.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 ml-4 min-w-[150px]">
                   {typeData.map((d, i) => (
                     <div key={i} className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                       <span className="text-xs text-slate-600 font-medium">{d.name}: {formatCurrency(d.value)}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center text-slate-400 text-sm italic">
                Sem lançamentos no mês selecionado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
