
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, RecurrenceType, User } from './types';
import { storageService, supabase } from './services/storageService';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Categories from './components/Categories';
import Reports from './components/Reports';
import { LayoutDashboard, ReceiptText, Tags, BarChart3, LogOut, ShieldCheck, User as UserIcon, Lock, Settings, X, Loader2, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'CATEGORIES' | 'REPORTS'>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Auth Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile Modal
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: User = {
          name: session.user.user_metadata.name || session.user.email?.split('@')[0],
          email: session.user.email!,
          isLoggedIn: true
        };
        setUser(u);
        fetchData();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const sbUser = await storageService.getCurrentUser();
      if (sbUser) {
        setUser({
          name: sbUser.user_metadata.name || sbUser.email?.split('@')[0],
          email: sbUser.email!,
          isLoggedIn: true
        });
        await fetchData();
      }
    } catch (e: any) {
      console.error("Erro na sessão:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setGlobalError(null);
    try {
      const [tData, cData] = await Promise.all([
        storageService.getTransactions(),
        storageService.getCategories()
      ]);
      setTransactions(tData);
      setCategories(cData);
    } catch (e: any) {
      console.error("Erro ao carregar dados:", e);
      setGlobalError(e.message || "Erro desconhecido ao carregar dados do Supabase. Verifique se as tabelas foram criadas.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await storageService.signIn(authForm.email, authForm.password);
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao entrar. Verifique suas credenciais.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await storageService.signUp(authForm.email, authForm.password, authForm.name);
      alert('Conta criada! Verifique seu e-mail para confirmar o cadastro, se necessário.');
      setIsRegistering(false);
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao criar conta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await storageService.signOut();
    setUser(null);
    setTransactions([]);
    setCategories([]);
    setAuthForm({ name: '', email: '', password: '' });
  };

  const addTransaction = async (data: any) => {
    if (!user) return;
    const { recurrence, status, ...baseData } = data;
    
    try {
      if (recurrence === RecurrenceType.NONE) {
        const newT = await storageService.saveTransaction({ ...baseData, status: status || TransactionStatus.PENDING });
        setTransactions(prev => [...prev, newT]);
      } else {
        let installments = 1, monthsToAdd = 0;
        switch (recurrence) {
          case RecurrenceType.MONTHLY: monthsToAdd = 1; installments = 12; break;
          case RecurrenceType.QUARTERLY: monthsToAdd = 3; installments = 4; break;
          case RecurrenceType.SEMIANNUAL: monthsToAdd = 6; installments = 2; break;
          case RecurrenceType.ANNUAL: monthsToAdd = 12; installments = 1; break;
        }
        const baseId = crypto.randomUUID();
        const startDate = new Date(data.dueDate);
        
        const promises = [];
        for (let i = 0; i < installments; i++) {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + (i * monthsToAdd));
          promises.push(storageService.saveTransaction({
            ...baseData,
            dueDate: d.toISOString().split('T')[0],
            status: status || TransactionStatus.PENDING,
            recurrenceId: baseId,
            installment: i + 1,
            totalInstallments: installments
          }));
        }
        await Promise.all(promises);
        await fetchData();
      }
    } catch (e: any) {
      alert("Erro ao salvar transação: " + e.message);
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      const updatedFromServer = await storageService.saveTransaction({ id, ...data });
      setTransactions(prev => prev.map(t => t.id === id ? updatedFromServer : t));
    } catch (e: any) {
      alert("Erro ao atualizar: " + e.message);
      fetchData();
    }
  };

  const deleteTransaction = async (id: string, deleteAllRecurrence?: boolean) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    try {
      if (deleteAllRecurrence && transaction.recurrenceId) {
        await storageService.deleteTransactionsByRecurrence(transaction.recurrenceId);
        setTransactions(prev => prev.filter(t => t.recurrenceId !== transaction.recurrenceId));
      } else {
        await storageService.deleteTransaction(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const addCategory = async (name: string, type: TransactionType) => {
    try {
      const newCat = await storageService.saveCategory({ name, type, icon: 'Tag' });
      setCategories(prev => [...prev, newCat]);
    } catch (e: any) {
      alert("Erro ao salvar categoria: " + e.message);
    }
  };

  const editCategory = async (id: string, name: string) => {
    try {
      const updated = await storageService.saveCategory({ id, name });
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
    } catch (e: any) {
      alert("Erro ao editar: " + e.message);
    }
  };

  const deleteCategory = async (id: string) => {
    if (window.confirm('Excluir categoria?')) {
      try {
        await storageService.deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
      } catch (e: any) {
        alert("Erro ao excluir: " + e.message);
      }
    }
  };

  const processedTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.map(t => {
      if (t.status === TransactionStatus.PENDING && t.dueDate < today) {
        return { ...t, status: TransactionStatus.OVERDUE };
      }
      return t;
    });
  }, [transactions]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin mb-4" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando com Supabase...</p>
      </div>
    );
  }

  if (!user || !user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-pulse animation-delay-2000"></div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl shadow-blue-500/20 mb-6">
              <ShieldCheck size={42} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Gestão Financeira</h1>
            <p className="text-slate-400 text-sm font-medium">
              {isRegistering ? 'Crie sua conta no Supabase Cloud' : 'Autenticação Segura via Supabase'}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
            {isRegistering && (
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  required
                  type="text" 
                  placeholder="Seu Nome"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
                  value={authForm.name}
                  onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </div>
            )}
            
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                required
                type="email" 
                placeholder="E-mail"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                required
                type="password" 
                placeholder="Senha"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs py-3 px-4 rounded-xl text-center font-semibold">
                {authError}
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] uppercase tracking-wider text-sm flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Cadastrar Agora' : 'Acessar Painel')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
              className="text-slate-400 hover:text-blue-400 text-xs font-bold transition-colors uppercase tracking-widest"
            >
              {isRegistering ? 'Voltar para o Login' : 'Novo por aqui? Criar Conta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-950 md:h-screen sticky top-0 z-40 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-white mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck size={24} />
            </div>
            <span className="font-black text-xl tracking-tight uppercase">Gestão</span>
          </div>

          <nav className="space-y-1.5">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
            <SidebarItem icon={<ReceiptText size={20} />} label="Lançamentos" active={activeTab === 'TRANSACTIONS'} onClick={() => setActiveTab('TRANSACTIONS')} />
            <SidebarItem icon={<Tags size={20} />} label="Categorias" active={activeTab === 'CATEGORIES'} onClick={() => setActiveTab('CATEGORIES')} />
            <SidebarItem icon={<BarChart3 size={20} />} label="Relatórios" active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 space-y-5">
          <div className="flex items-center gap-3">
             <div className="w-11 h-11 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 font-bold">
               {user.name.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-black text-white truncate">{user.name}</p>
               <p className="text-[10px] text-slate-500 truncate font-bold uppercase tracking-tighter">{user.email}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest bg-white/5 p-3 rounded-xl">
              <Settings size={14} /> Configurações
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-rose-500 hover:text-rose-400 transition-all text-[10px] font-black uppercase tracking-widest p-3">
              <LogOut size={14} /> Encerrar Sessão
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-x-hidden">
        {loading && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-blue-600/20 z-50">
            <div className="h-full bg-blue-600 animate-[loading_1.5s_infinite_linear]" style={{width: '30%'}}></div>
          </div>
        )}

        {globalError && (
          <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900 uppercase tracking-tight">Erro de Sincronização</h3>
              <p className="text-sm text-rose-700 mt-1">{globalError}</p>
              <button 
                onClick={fetchData}
                className="mt-3 text-xs font-black uppercase tracking-widest text-rose-600 hover:text-rose-800 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
        
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {activeTab === 'DASHBOARD' && 'Dashboard Supabase'}
            {activeTab === 'TRANSACTIONS' && 'Gestão de Lançamentos'}
            {activeTab === 'CATEGORIES' && 'Minhas Categorias'}
            {activeTab === 'REPORTS' && 'Relatórios Dinâmicos'}
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-medium mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span>Nuvem Conectada: {user.name}. Sistema Online.</span>
          </div>
        </header>

        {activeTab === 'DASHBOARD' && (
          <Dashboard transactions={processedTransactions} categories={categories} currentMonth={currentMonth} currentYear={currentYear} />
        )}
        {activeTab === 'TRANSACTIONS' && (
          <Transactions 
            transactions={processedTransactions} categories={categories} 
            currentMonth={currentMonth} currentYear={currentYear}
            onAdd={addTransaction} onEdit={updateTransaction} onDelete={deleteTransaction}
            onNavigate={(m, y) => { setCurrentMonth(m); setCurrentYear(y); }}
          />
        )}
        {activeTab === 'CATEGORIES' && (
          <Categories 
            categories={categories} 
            transactions={processedTransactions}
            onAdd={addCategory} 
            onEdit={editCategory} 
            onDelete={deleteCategory} 
          />
        )}
        {activeTab === 'REPORTS' && (
          <Reports transactions={processedTransactions} categories={categories} />
        )}
      </main>

      {showProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configurações</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Status da Conta</p>
                <p className="text-sm font-medium text-blue-900">Seus dados estão sendo persistidos com segurança no Supabase Cloud.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail (Não editável)</label>
                  <input 
                    disabled
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 font-medium cursor-not-allowed"
                    value={user.email}
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowProfileModal(false)}
                className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl"
              >
                Fechar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
      active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-100'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;
