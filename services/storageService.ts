
import { createClient } from '@supabase/supabase-js';
import { Transaction, Category, User, TransactionType } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const SUPABASE_URL = 'https://nnldfkbdunpfjpuqbusq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uSI7YYGkD8H05sQ_Dr6PnQ_0I4Q_qew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export ADMIN_UID as required by AdminApproval.tsx imports
export const ADMIN_UID = '00000000-0000-0000-0000-000000000000';

export const storageService = {
  // --- AUTHENTICATION ---
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // --- USER PROFILE ---
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
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('dueDate', { ascending: true });
    
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
      user_id: user.id
    };

    if (transaction.id && transaction.id.trim() !== "") {
      const { data, error } = await supabase.from('transactions').update(dbPayload).eq('id', transaction.id).select();
      if (error) throw new Error(error.message);
      return data[0];
    } else {
      const { data, error } = await supabase.from('transactions').insert(dbPayload).select();
      if (error) throw new Error(error.message);
      return data[0];
    }
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteTransactionsByRecurrence(recurrenceId: string) {
    const { error } = await supabase.from('transactions').delete().eq('recurrenceId', recurrenceId);
    if (error) throw new Error(error.message);
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw new Error(error.message);
    return (data && data.length > 0) ? (data as Category[]) : INITIAL_CATEGORIES;
  },

  async saveCategory(category: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const dbPayload: any = {
      name: category.name,
      icon: category.icon || 'Tag',
      user_id: user.id
    };
    
    if (category.type) {
      dbPayload.type = category.type;
    }

    if (category.id && category.id.trim() !== "" && !category.id.startsWith('exp-') && !category.id.startsWith('inc-')) {
      const { data, error } = await supabase.from('categories').update(dbPayload).eq('id', category.id).select();
      if (error) throw new Error(error.message);
      return data ? data[0] : null;
    } else {
      const { data, error } = await supabase.from('categories').insert(dbPayload).select();
      if (error) throw new Error(error.message);
      return data ? data[0] : null;
    }
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- ADMIN APPROVAL ---
  // Added missing method to fetch all access requests for AdminApproval.tsx
  async getAllAccessRequests() {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Added missing method to update user approval status for AdminApproval.tsx
  async updateApproval(email: string, approved: boolean) {
    const { error } = await supabase
      .from('access_requests')
      .update({ approved })
      .eq('email', email);
    if (error) throw new Error(error.message);
  }
};
