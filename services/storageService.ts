
import { createClient } from '@supabase/supabase-js';
import { Transaction, Category, User, TransactionType } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const SUPABASE_URL = 'https://nnldfkbdunpfjpuqbusq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uSI7YYGkD8H05sQ_Dr6PnQ_0I4Q_qew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const storageService = {
  // --- AUTHENTICATION ---
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { name } }
    });
    if (error) throw error;
    return data.user;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('dueDate', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Transaction[];
  },

  async saveTransaction(transaction: Partial<Transaction>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Limpeza de dados para evitar erros de tipo UUID
    const cleanData = { ...transaction };
    if (!cleanData.id) delete cleanData.id;
    if (!cleanData.recurrenceId) delete cleanData.recurrenceId;

    if (transaction.id && transaction.id.trim() !== "") {
      // Atualização
      const { data, error } = await supabase
        .from('transactions')
        .update(cleanData)
        .eq('id', transaction.id)
        .select();
      
      if (error) throw error;
      return data[0];
    } else {
      // Inserção
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...cleanData, user_id: user.id })
        .select();
      
      if (error) throw error;
      return data[0];
    }
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteTransactionsByRecurrence(recurrenceId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('recurrenceId', recurrenceId);
    
    if (error) throw error;
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) throw error;
    return data && data.length > 0 ? (data as Category[]) : INITIAL_CATEGORIES;
  },

  async saveCategory(category: Partial<Category>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const cleanData = { ...category };
    if (!cleanData.id) delete cleanData.id;

    if (category.id && category.id.trim() !== "") {
      const { data, error } = await supabase
        .from('categories')
        .update(cleanData)
        .eq('id', category.id)
        .select();
      if (error) throw error;
      return data[0];
    } else {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...cleanData, user_id: user.id })
        .select();
      if (error) throw error;
      return data[0];
    }
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
