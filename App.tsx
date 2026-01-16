
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus, Category, RecurrenceType, User } from './types';
import { storageService, supabase, ADMIN_UID } from './services/storageService';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Categories from './components/Categories';
import Reports from './components/Reports';
import Profile from './components/Profile';
import AdminApproval from './components/AdminApproval';
import { LayoutDashboard, ReceiptText, Tags, BarChart3, LogOut, ShieldCheck, Loader2, User as UserIcon, ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'CATEGORIES' | 'REPORTS' | 'ADMIN'>('DASHBOARD');
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Primeiro garante que o usuário está na tabela de controle
        await storageService.syncUserToAccessRequests(session.user);

        // Se não for o admin principal, verifica se está habilitado
        if (session.user.id !== ADMIN_UID) {
          const isApproved = await storageService.checkUserApproval(session.user.email!);
          if (!isApproved) {
            await storageService.signOut();
            setUser(null);
            setAuthError('Usuário sem permissão. Você precisa de permissão para utilizar o recurso.');
            setLoading(false);
            return;
          }
        }

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
        if (sbUser.id !== ADMIN_UID) {
          const isApproved = await storageService.checkUserApproval(sbUser.email!);
          if (!isApproved) {
            await storageService.signOut();
            setUser(null);
            setLoading(false);
            return;
          }
        }
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

  const fetchData = async (userId?: string) => {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const loginUser = await storageService.signIn(authForm.email, authForm.password);
      await storageService.syncUserToAccessRequests(loginUser);
      
      if (loginUser.id !== ADMIN_UID) {
        const isApproved = await storageService.checkUserApproval(authForm.email);
        if (!isApproved) {
          await storageService.signOut();
          setAuthError('Usuário sem permissão. Você precisa de permissão para utilizar o recurso.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Falha no login. Verifique e-mail e senha.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await storageService.signOut();
    setUser(null);
    setActiveTab('DASHBOARD');
  };

  const isAdmin = user?.id === ADMIN_UID;

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-[420px]">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-xl mb-5"><ShieldCheck size={32} className="text-white" /></div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Gestão Financeira</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Acesso Restrito</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input required type="email" placeholder="E-mail" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <input required type="password" placeholder="Senha" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            {authError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] font-bold text-center uppercase leading-relaxed animate-in fade-in zoom-in duration-300">
                {authError}
              </div>
            )}
            <button type="submit" disabled={authLoading} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center">
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
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <p className="px-4 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">Administração</p>
              <SidebarItem icon={<ShieldAlert size={20} />} label="Gestão de Acessos" active={activeTab === 'ADMIN'} onClick={() => setActiveTab('ADMIN')} />
            </div>
          )}
        </nav>
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={() => setShowProfileModal(true)} className="w-full flex items-center gap-2 text-slate-400 hover:text-white font-bold uppercase text-[10px] tracking-widest p-2 mb-2 transition-all">
            <UserIcon size={16} /> Meu Perfil
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-rose-500 hover:text-rose-400 font-bold uppercase text-[10px] tracking-widest p-2 transition-all">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
              {activeTab === 'DASHBOARD' && 'Dashboard'}
              {activeTab === 'TRANSACTIONS' && 'Lançamentos'}
              {activeTab === 'CATEGORIES' && 'Categorias'}
              {activeTab === 'REPORTS' && 'Relatórios'}
              {activeTab === 'ADMIN' && 'Controle de Acessos'}
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
              {isAdmin ? 'Modo Administrador' : `Bem-vindo, ${user.name}`}
            </p>
          </div>
        </header>

        {activeTab === 'DASHBOARD' && <Dashboard transactions={transactions} categories={categories} currentMonth={currentMonth} currentYear={currentYear} />}
        {activeTab === 'TRANSACTIONS' && <Transactions transactions={transactions} categories={categories} currentMonth={currentMonth} currentYear={currentYear} onAdd={(d) => storageService.saveTransaction(d).then(() => fetchData(user.id))} onEdit={(id, d) => storageService.saveTransaction({id, ...d}).then(() => fetchData(user.id))} onDelete={(id) => storageService.deleteTransaction(id).then(() => fetchData(user.id))} onNavigate={(m, y) => { setCurrentMonth(m); setCurrentYear(y); }} />}
        {activeTab === 'CATEGORIES' && <Categories categories={categories} transactions={transactions} onAdd={(n, t) => storageService.saveCategory({name: n, type: t, icon: 'Tag'}).then(() => fetchData(user.id))} onEdit={(id, n) => storageService.saveCategory({id, name: n}).then(() => fetchData(user.id))} onDelete={id => storageService.deleteCategory(id).then(() => fetchData(user.id))} />}
        {activeTab === 'REPORTS' && <Reports transactions={transactions} categories={categories} />}
        {activeTab === 'ADMIN' && isAdmin && <AdminApproval />}
      </main>

      {showProfileModal && user && (
        <Profile user={{ name: user.name, email: user.email }} onClose={() => setShowProfileModal(false)} onUpdateSuccess={(newName) => setUser({ ...user, name: newName })} />
      )}
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-slate-100'}`}>{icon} {label}</button>
);

export default App;
