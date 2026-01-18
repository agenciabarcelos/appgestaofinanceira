
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, RecurrenceType, User } from './types';
import { storageService, supabase } from './services/storageService';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Categories from './components/Categories';
import Reports from './components/Reports';
import Profile from './components/Profile';
import { LayoutDashboard, ReceiptText, Tags, BarChart3, LogOut, ShieldCheck, Loader2, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'CATEGORIES' | 'REPORTS'>('DASHBOARD');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<(User & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Agora aceitamos qualquer usuário logado com sucesso no Supabase Auth
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0],
          email: session.user.email!,
          isLoggedIn: true
        });
        fetchData(session.user.id);
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
          id: sbUser.id,
          name: sbUser.user_metadata.name || sbUser.email?.split('@')[0],
          email: sbUser.email!,
          isLoggedIn: true
        });
        await fetchData(sbUser.id);
      }
    } catch (e: any) {
      console.error(e.message || "Erro na sessão");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (userId: string) => {
    setLoading(true);
    try {
      const [tData, cData] = await Promise.all([
        storageService.getTransactions(userId),
        storageService.getCategories()
      ]);
      setTransactions(tData);
      setCategories(cData);
    } catch (e: any) {
      console.error(e.message || "Erro ao buscar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      await storageService.signIn(authForm.email, authForm.password);
    } catch (err: any) {
      setAuthError(err.message || 'Falha na autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await storageService.signOut();
    setUser(null);
    setTransactions([]);
    setCategories([]);
    setActiveTab('DASHBOARD');
  };

  const addTransaction = async (data: any) => {
    if (!user?.id) return;
    const { id, installmentsCount, recurrence, amount, description, ...baseData } = data;
    
    try {
      setLoading(true);
      if (installmentsCount > 1) {
        const amountPerParcel = amount / installmentsCount;
        const baseId = crypto.randomUUID();
        const startDate = new Date(data.dueDate);
        const promises = [];
        for (let i = 0; i < installmentsCount; i++) {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i);
          promises.push(storageService.saveTransaction({
            ...baseData,
            description: `${description} (${i + 1}/${installmentsCount})`,
            amount: amountPerParcel, 
            dueDate: d.toISOString().split('T')[0],
            recurrenceId: baseId, 
            installment: i + 1, 
            totalInstallments: installmentsCount
          }));
        }
        await Promise.all(promises);
      } else if (recurrence !== RecurrenceType.NONE) {
        let monthsStep = 1;
        let count = 12;
        if (recurrence === RecurrenceType.QUARTERLY) { monthsStep = 3; count = 4; }
        else if (recurrence === RecurrenceType.SEMIANNUAL) { monthsStep = 6; count = 2; }
        else if (recurrence === RecurrenceType.ANNUAL) { monthsStep = 12; count = 1; }
        const baseId = crypto.randomUUID();
        const startDate = new Date(data.dueDate);
        const promises = [];
        for (let i = 0; i < count; i++) {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + (i * monthsStep));
          promises.push(storageService.saveTransaction({
            ...baseData,
            description: description,
            amount: amount, 
            dueDate: d.toISOString().split('T')[0],
            recurrenceId: baseId, 
            installment: i + 1, 
            totalInstallments: count
          }));
        }
        await Promise.all(promises);
      } else {
        await storageService.saveTransaction({ ...baseData, description, amount });
      }
      await fetchData(user.id);
    } catch (e: any) {
      alert("Erro ao salvar: " + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: string, data: any) => {
    if (!user?.id) return;
    try {
      await storageService.saveTransaction({ ...data, id });
      await fetchData(user.id);
    } catch (e: any) {
      alert("Erro ao atualizar: " + (e.message || e));
    }
  };

  const deleteTransaction = async (id: string, deleteAllRecurrence?: boolean) => {
    if (!user?.id) return;
    try {
      if (deleteAllRecurrence) {
        const t = transactions.find(x => x.id === id);
        if (t?.recurrenceId) {
          await storageService.deleteTransactionsByRecurrence(t.recurrenceId);
        }
      } else {
        await storageService.deleteTransaction(id);
      }
      await fetchData(user.id);
    } catch (e: any) {
      alert("Erro ao excluir: " + (e.message || e));
    }
  };

  const processedTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.map(t => {
      if (t.status === TransactionStatus.PENDING && t.dueDate < today) return { ...t, status: TransactionStatus.OVERDUE };
      return t;
    });
  }, [transactions]);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin mb-4" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Aguarde...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-[420px] relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-xl mb-5">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Gestão Financeira</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              Acesso ao Sistema
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input required type="email" placeholder="E-mail" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <input required type="password" placeholder="Senha" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-500" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            
            {authError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] font-bold text-center uppercase leading-relaxed">
                {authError}
              </div>
            )}

            <button type="submit" disabled={authLoading} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-950 md:h-screen sticky top-0 z-40 flex flex-col p-6">
        <div className="flex items-center gap-3 text-white mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
          <span className="font-black text-xl tracking-tight uppercase">Gestão</span>
        </div>
        <nav className="space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
          <SidebarItem icon={<ReceiptText size={20} />} label="Lançamentos" active={activeTab === 'TRANSACTIONS'} onClick={() => setActiveTab('TRANSACTIONS')} />
          <SidebarItem icon={<Tags size={20} />} label="Categorias" active={activeTab === 'CATEGORIES'} onClick={() => setActiveTab('CATEGORIES')} />
          <SidebarItem icon={<BarChart3 size={20} />} label="Relatórios" active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} />
        </nav>
        <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-widest p-2 transition-all"
          >
            <UserIcon size={16} /> Meu Perfil
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-rose-500 hover:text-rose-400 font-black uppercase text-[10px] tracking-widest p-2 transition-all">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {activeTab === 'DASHBOARD' && 'Dashboard'}
            {activeTab === 'TRANSACTIONS' && 'Lançamentos'}
            {activeTab === 'CATEGORIES' && 'Categorias'}
            {activeTab === 'REPORTS' && 'Relatórios'}
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            Olá, {user.name}. Bem-vindo ao seu painel financeiro.
          </p>
        </header>

        {activeTab === 'DASHBOARD' && <Dashboard transactions={processedTransactions} categories={categories} currentMonth={currentMonth} currentYear={currentYear} />}
        {activeTab === 'TRANSACTIONS' && <Transactions transactions={processedTransactions} categories={categories} currentMonth={currentMonth} currentYear={currentYear} onAdd={addTransaction} onEdit={updateTransaction} onDelete={deleteTransaction} onNavigate={(m, y) => { setCurrentMonth(m); setCurrentYear(y); }} />}
        {activeTab === 'CATEGORIES' && <Categories categories={categories} transactions={processedTransactions} onAdd={(n, t) => storageService.saveCategory({name: n, type: t, icon: 'Tag'}).then(() => fetchData(user.id!))} onEdit={(id, n) => storageService.saveCategory({id, name: n}).then(() => fetchData(user.id!))} onDelete={id => storageService.deleteCategory(id).then(() => fetchData(user.id!))} />}
        {activeTab === 'REPORTS' && <Reports transactions={processedTransactions} categories={categories} />}
      </main>

      {showProfileModal && user && (
        <Profile 
          user={{ name: user.name, email: user.email }} 
          onClose={() => setShowProfileModal(false)}
          onUpdateSuccess={(newName) => setUser({ ...user, name: newName })}
        />
      )}
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-100'}`}>{icon} {label}</button>
);

export default App;
