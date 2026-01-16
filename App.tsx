
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
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.name || session.user.email?.split('@')[0],
          email: session.user.email!,
          isLoggedIn: true
        });
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
    } catch (e) {
      console.error(e);
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
      setGlobalError(e.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await storageService.signIn(authForm.email, authForm.password);
    } catch (err: any) {
      setAuthError('Falha no login. Verifique e-mail e senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await storageService.signUp(authForm.email, authForm.password, authForm.name);
      setIsRegistering(false);
      alert("Conta criada com sucesso! Você já pode acessar o sistema.");
    } catch (err: any) {
      setAuthError('Erro ao criar conta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await storageService.signOut();
    setUser(null);
    setTransactions([]);
    setCategories([]);
  };

  const addTransaction = async (data: any) => {
    try {
      if (data.installmentsCount > 1) {
        const amountPerParcel = data.amount / data.installmentsCount;
        const baseId = crypto.randomUUID();
        const startDate = new Date(data.dueDate);
        const promises = [];
        for (let i = 0; i < data.installmentsCount; i++) {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i);
          promises.push(storageService.saveTransaction({
            ...data, amount: amountPerParcel, dueDate: d.toISOString().split('T')[0],
            recurrenceId: baseId, installment: i + 1, totalInstallments: data.installmentsCount
          }));
        }
        await Promise.all(promises);
      } else {
        await storageService.saveTransaction(data);
      }
      await fetchData();
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      await storageService.saveTransaction({ id, ...data });
      await fetchData();
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  const deleteTransaction = async (id: string, deleteAllRecurrence?: boolean) => {
    try {
      if (deleteAllRecurrence) {
        const t = transactions.find(x => x.id === id);
        if (t?.recurrenceId) await storageService.deleteTransactionsByRecurrence(t.recurrenceId);
      } else {
        await storageService.deleteTransaction(id);
      }
      await fetchData();
    } catch (e: any) {
      alert("Erro: " + e.message);
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
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="text-blue-500 animate-spin" size={48} /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-[400px]">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-xl mb-5"><ShieldCheck size={32} className="text-white" /></div>
            <h1 className="text-2xl font-black text-white uppercase">Gestão Financeira</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{isRegistering ? 'Cadastre-se Grátis' : 'Login de Acesso'}</p>
          </div>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && <input required type="text" placeholder="Nome" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />}
            <input required type="email" placeholder="E-mail" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <input required type="password" placeholder="Senha" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            {authError && <p className="text-rose-500 text-[10px] font-bold text-center uppercase">{authError}</p>}
            <button type="submit" disabled={authLoading} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center">{authLoading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Criar Conta' : 'Entrar no Painel')}</button>
          </form>
          <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="w-full mt-6 text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">{isRegistering ? 'Já tenho conta' : 'Ainda não tenho conta'}</button>
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
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-rose-500 hover:text-rose-400 font-black uppercase text-[10px] tracking-widest p-2 transition-all"><LogOut size={16} /> Encerrar Sessão</button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {activeTab === 'DASHBOARD' && 'Dashboard'}
            {activeTab === 'TRANSACTIONS' && 'Lançamentos'}
            {activeTab === 'CATEGORIES' && 'Categorias'}
            {activeTab === 'REPORTS' && 'Relatórios'}
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Conectado como {user.name}</p>
        </header>
        {activeTab === 'DASHBOARD' && <Dashboard transactions={processedTransactions} categories={categories} currentMonth={currentMonth} currentYear={currentYear} />}
        {activeTab === 'TRANSACTIONS' && <Transactions transactions={processedTransactions} categories={categories} currentMonth={currentMonth} currentYear={currentYear} onAdd={addTransaction} onEdit={updateTransaction} onDelete={deleteTransaction} onNavigate={(m, y) => { setCurrentMonth(m); setCurrentYear(y); }} />}
        {activeTab === 'CATEGORIES' && <Categories categories={categories} transactions={processedTransactions} onAdd={(n, t) => storageService.saveCategory({name: n, type: t, icon: 'Tag'}).then(fetchData)} onEdit={(id, n) => storageService.saveCategory({id, name: n}).then(fetchData)} onDelete={id => storageService.deleteCategory(id).then(fetchData)} />}
        {activeTab === 'REPORTS' && <Reports transactions={processedTransactions} categories={categories} />}
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-slate-100'}`}>{icon} {label}</button>
);

export default App;
