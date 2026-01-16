
import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { CheckCircle, XCircle, Clock, UserCheck, Mail, Calendar, Loader2 } from 'lucide-react';

const AdminApproval: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await storageService.getAllAccessRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      alert("Erro ao atualizar status.");
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-slate-400 text-xs font-bold uppercase">Carregando solicitações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <UserCheck size={120} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-2">Painel do Desenvolvedor</h2>
          <p className="text-slate-400 text-sm font-medium max-w-md">
            Gerencie o acesso de novos usuários ao sistema. Somente usuários aprovados podem visualizar dados e realizar lançamentos.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Cadastro</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma solicitação encontrada.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.email} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                          {req.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800">{req.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {req.email}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-bold">
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      {req.approved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase">
                          <CheckCircle size={12} /> Habilitado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-tighter">
                          <Clock size={12} /> Aguardando
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={actioning === req.email}
                        onClick={() => handleToggleApproval(req.email, req.approved)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          req.approved 
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                        } disabled:opacity-50`}
                      >
                        {actioning === req.email ? <Loader2 className="animate-spin mx-auto" size={14} /> : (req.approved ? 'Bloquear' : 'Habilitar')}
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
