
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { CheckCircle, XCircle, Clock, UserCheck, Loader2, User as UserIcon } from 'lucide-react';

const AdminApproval: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await storageService.getAllAccessRequests();
      setRequests(data);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleToggleApproval = async (email: string, currentStatus: boolean) => {
    setActioning(email);
    try {
      await storageService.updateApproval(email, !currentStatus);
      await fetchRequests();
    } catch (e: any) {
      alert("Erro ao atualizar status: " + e.message);
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sincronizando base de usuários...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <UserCheck size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Gestão de Clientes</h2>
          <p className="text-slate-400 text-sm font-medium max-w-md">
            Visualize todos os usuários cadastrados e controle quem possui permissão ativa para acessar o recurso.
          </p>
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
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-medium">Nenhum cliente cadastrado no momento.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.email} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                          {req.name ? req.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-bold text-slate-800">{req.name || 'Sem Nome'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold uppercase tracking-tight">
                      {req.email}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-bold">
                      {new Date(req.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {req.approved ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                          <CheckCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Ativo</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                          <XCircle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Bloqueado</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={actioning === req.email}
                        onClick={() => handleToggleApproval(req.email, req.approved)}
                        className={`min-w-[110px] px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                          req.approved 
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                        } disabled:opacity-50 flex items-center justify-center gap-2 ml-auto`}
                      >
                        {actioning === req.email ? <Loader2 className="animate-spin" size={14} /> : (req.approved ? 'Bloquear' : 'Habilitar')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminApproval;
