
import React, { useEffect, useState } from 'react';
import { storageService, ADMIN_UID } from '../services/storageService';
import { CheckCircle, XCircle, UserCheck, Loader2, Mail, Calendar, Shield } from 'lucide-react';

const AdminApproval: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storageService.getAllAccessRequests();
      setUsers(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleApproval = async (email: string, currentStatus: boolean) => {
    setActioning(email);
    try {
      await storageService.updateApproval(email, !currentStatus);
      await fetchUsers();
    } catch (e: any) {
      alert("Erro ao alterar status: " + e.message);
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sincronizando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-10 rounded-[2.5rem] text-center max-w-2xl mx-auto mt-10">
        <XCircle className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-xl font-black text-rose-900 uppercase mb-2">Erro de Banco de Dados</h3>
        <p className="text-rose-700 text-sm font-medium mb-6">{error}</p>
        <div className="bg-white p-4 rounded-xl text-left text-[10px] font-mono text-slate-600 border border-rose-200">
          SQL necessário: CREATE TABLE access_requests (id uuid primary key default gen_random_uuid(), email text unique, name text, approved boolean default false, created_at timestamp default now());
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10"><UserCheck size={120} /></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Gestão de Clientes</h2>
          <p className="text-slate-400 text-sm font-medium max-w-md">Controle quem pode acessar os recursos financeiros do sistema.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Cadastro</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((client) => (
                <tr key={client.email} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                        {client.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="font-black text-slate-800 tracking-tight">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                      <Mail size={12} className="text-slate-400" />
                      {client.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tight">
                      <Calendar size={12} />
                      {new Date(client.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {client.approved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle size={14} /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest">
                        <XCircle size={14} /> Bloqueado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      disabled={actioning === client.email}
                      onClick={() => handleToggleApproval(client.email, client.approved)}
                      className={`min-w-[120px] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ml-auto ${
                        client.approved 
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20'
                      }`}
                    >
                      {actioning === client.email ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        client.approved ? 'Bloquear' : 'Habilitar'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest italic">
                    Nenhum cliente cadastrado no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminApproval;
