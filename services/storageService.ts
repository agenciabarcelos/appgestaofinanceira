
import { createClient } from '@supabase/supabase-js';
import { Transaction, Category, User, TransactionType } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const SUPABASE_URL = 'https://nnldfkbdunpfjpuqbusq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uSI7YYGkD8H05sQ_Dr6PnQ_0I4Q_qew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const ADMIN_UID = '8f2e7c01-a013-4484-98ae-c6c013bad992';

export const storageService = {
  // --- AUTHENTICATION ---
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  },

  async syncUserToAccessRequests(user: any) {
    // Garante que o usuário exista na tabela de controle de acesso
    const { data, error } = await supabase
      .from('access_requests')
      .select('email')
      .eq('email', user.email)
      .single();

    if (!data && (!error || error.code === 'PGRST116')) {
      await supabase.from('access_requests').insert({
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        approved: user.id === ADMIN_UID // Admin já nasce aprovado
      });
    }
  },

  async checkUserApproval(email: string) {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('approved')
        .eq('email', email)
        .single();
      
      if (error) {
        if (error.code === '42P01') throw new Error("A tabela 'access_requests' não foi encontrada no banco de dados.");
        return false;
      }
      return data?.approved || false;
    } catch (e: any) {
      console.error("Erro ao validar permissão:", e.message);
      return false;
    }
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // --- USER PROFILE ---
  // Fix: Added missing updateUserProfile method
  async updateUserProfile(name: string, password?: string) {
    const updateData: any = { data: { name } };
    if (password) {
      updateData.password = password;
    }
    const { data, error } = await supabase.auth.updateUser(updateData);
    if (error) throw new Error(error.message);
    return data.user;
  },

  // --- TRANSACTIONS ---
  async getTransactions(userId?: string): Promise<Transaction[]> {
    let query = supabase.from('transactions').select('*');
    if (userId && userId !== ADMIN_UID) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query.order('dueDate', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Transaction[];
  },

  async saveTransaction(transaction: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const dbPayload: any = {
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      dueDate: transaction.dueDate,
      categoryId: transaction.categoryId,
      status: transaction.status,
      recurrenceId: transaction.recurrenceId || null,
      installment: transaction.installment || null,
      totalInstallments: transaction.totalInstallments || null,
    };

    if (transaction.id && transaction.id.trim() !== "") {
      const { data, error } = await supabase.from('transactions').update(dbPayload).eq('id', transaction.id).select();
      if (error) throw new Error(error.message);
      return data[0];
    } else {
      const { data, error } = await supabase.from('transactions').insert({ ...dbPayload, user_id: user.id }).select();
      if (error) throw new Error(error.message);
      return data[0];
    }
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw new Error(error.message);
    return (data && data.length > 0) ? (data as Category[]) : INITIAL_CATEGORIES;
  },

  // Fix: Added missing saveCategory method
  async saveCategory(category: any) {
    const dbPayload: any = {
      name: category.name,
      icon: category.icon || 'Tag',
    };
    
    if (category.type) {
      dbPayload.type = category.type;
    }

    if (category.id && category.id.trim() !== "") {
      const { data, error } = await supabase.from('categories').update(dbPayload).eq('id', category.id).select();
      if (error) throw new Error(error.message);
      return data ? data[0] : null;
    } else {
      const { data, error } = await supabase.from('categories').insert(dbPayload).select();
      if (error) throw new Error(error.message);
      return data ? data[0] : null;
    }
  },

  // Fix: Added missing deleteCategory method
  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- ACCESS REQUESTS ---
  async getAllAccessRequests() {
    const { data, error } = await supabase.from('access_requests').select('*').order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') throw new Error("Tabela de usuários não encontrada. Verifique o banco de dados.");
      throw new Error(error.message);
    }
    return data || [];
  },

  async updateApproval(email: string, approved: boolean) {
    const { data, error } = await supabase.from('access_requests').update({ approved }).eq('email', email).select();
    if (error) throw new Error(error.message);
    return data ? data[0] : null;
  }
};
