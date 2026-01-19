
import { createClient } from '@supabase/supabase-js';
import { Transaction, Category, User, TransactionType } from '../types';
import { INITIAL_CATEGORIES } from '../constants';

const SUPABASE_URL = 'https://nnldfkbdunpfjpuqbusq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uSI7YYGkD8H05sQ_Dr6PnQ_0I4Q_qew';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const ADMIN_UID = '00000000-0000-0000-0000-000000000000';

const isValidUUID = (uuid: any) => {
  if (!uuid || typeof uuid !== 'string') return false;
  const match = uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  return !!match;
};

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

    // Normalização final do valor
    let numericAmount = 0;
    if (typeof transaction.amount === 'string') {
      numericAmount = parseFloat(transaction.amount.replace(',', '.'));
    } else {
      numericAmount = Number(transaction.amount);
    }

    if (isNaN(numericAmount)) {
      numericAmount = 0;
    }

    const categoryId = isValidUUID(transaction.categoryId) ? transaction.categoryId : null;

    const dbPayload: any = {
      type: transaction.type,
      description: transaction.description,
      amount: numericAmount,
      dueDate: transaction.dueDate,
      categoryId: categoryId,
      status: transaction.status,
      recurrenceId: isValidUUID(transaction.recurrenceId) ? transaction.recurrenceId : null,
      installment: transaction.installment || null,
      totalInstallments: transaction.totalInstallments || null,
      user_id: user.id
    };

    const cleanId = transaction.id && isValidUUID(transaction.id) ? transaction.id : null;

    try {
      if (cleanId) {
        const { data, error } = await supabase.from('transactions').update(dbPayload).eq('id', cleanId).select();
        if (error) throw new Error(error.message);
        return data[0];
      } else {
        const { data, error } = await supabase.from('transactions').insert(dbPayload).select();
        if (error) throw new Error(error.message);
        return data[0];
      }
    } catch (err: any) {
      if (err.message?.includes('transactions_categoryId_fkey')) {
        throw new Error("A categoria selecionada não existe no banco de dados. Tente recarregar a página.");
      }
      throw err;
    }
  },

  async deleteTransaction(id: string) {
    if (!isValidUUID(id)) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteTransactionsByRecurrence(recurrenceId: string) {
    if (!isValidUUID(recurrenceId)) return;
    const { error } = await supabase.from('transactions').delete().eq('recurrenceId', recurrenceId);
    if (error) throw new Error(error.message);
  },

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    const user = await this.getCurrentUser();
    if (!user) return INITIAL_CATEGORIES;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);
      
    if (error) throw new Error(error.message);
    
    if (!data || data.length === 0) {
      const seedData = INITIAL_CATEGORIES.map(cat => ({
        id: cat.id, 
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        user_id: user.id
      }));

      const { data: seededData, error: seedError } = await supabase
        .from('categories')
        .insert(seedData)
        .select();

      if (seedError) {
        console.error("Erro ao semear categorias:", seedError.message);
        return INITIAL_CATEGORIES;
      }
      return seededData as Category[];
    }

    return data as Category[];
  },

  async saveCategory(category: any) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const dbPayload: any = {
      name: category.name,
      icon: category.icon || 'Tag',
      type: category.type || TransactionType.PAYABLE,
      user_id: user.id
    };
    
    const cleanId = category.id && isValidUUID(category.id) ? category.id : null;

    if (cleanId) {
      const { data, error } = await supabase.from('categories').update(dbPayload).eq('id', cleanId).select();
      if (error) throw new Error(error.message);
      return data ? data[0] : null;
    } else {
      const { data, error } = await supabase.from('categories').insert(dbPayload).select();
      if (error) throw new Error(error.message);
      return data ? data[0] : null;
    }
  },

  async deleteCategory(id: string) {
    if (!isValidUUID(id)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getAllAccessRequests() {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async updateApproval(email: string, approved: boolean) {
    const { error } = await supabase
      .from('access_requests')
      .update({ approved })
      .eq('email', email);
    if (error) throw new Error(error.message);
  }
};
