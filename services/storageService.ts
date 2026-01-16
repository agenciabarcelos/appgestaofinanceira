
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

  async checkUserApproval(email: string) {
    const { data, error } = await supabase
      .from('access_requests')
      .select('approved')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data?.approved || false;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async updateUserProfile(name?: string, password?: string) {
    const attributes: any = {};
    if (name) attributes.data = { name };
    if (password) attributes.password = password;

    const { data, error } = await supabase.auth.updateUser(attributes);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

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

    const id = transaction.id;
    if (id && id.trim() !== "") {
      const { data, error } = await supabase
        .from('transactions')
        .update(dbPayload)
        .eq('id', id)
        .select();
      if (error) throw new Error(error.message);
      return data[0];
    } else {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...dbPayload, user_id: user.id })
        .select();
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

  async saveCategory(category: Partial<Category>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const cleanData = { ...category };
    if (!cleanData.id) delete cleanData.id;
    if (category.id && category.id.trim() !== "" && !category.id.startsWith('exp-') && !category.id.startsWith('inc-')) {
      const { data, error } = await supabase.from('categories').update(cleanData).eq('id', category.id).select();
      if (error) throw new Error(error.message);
      return data[0];
    } else {
      const { data, error } = await supabase.from('categories').insert({ ...cleanData, user_id: user.id }).select();
      if (error) throw new Error(error.message);
      return data[0];
    }
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getAllAccessRequests() {
    const { data, error } = await supabase.from('access_requests').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async updateApproval(email: string, approved: boolean) {
    const { data, error } = await supabase.from('access_requests').update({ approved }).eq('email', email).select();
    if (error) throw new Error(error.message);
    return data ? data[0] : null;
  }
};
