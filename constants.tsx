
import { Category, TransactionType } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  // DESPESAS (PAYABLE)
  { id: 'exp-001', name: 'Alimentação', type: TransactionType.PAYABLE, icon: 'Utensils' },
  { id: 'exp-002', name: 'Transporte', type: TransactionType.PAYABLE, icon: 'Car' },
  { id: 'exp-003', name: 'Moradia', type: TransactionType.PAYABLE, icon: 'Home' },
  { id: 'exp-004', name: 'Saúde', type: TransactionType.PAYABLE, icon: 'HeartPulse' },
  { id: 'exp-005', name: 'Lazer', type: TransactionType.PAYABLE, icon: 'Gamepad2' },
  { id: 'exp-006', name: 'Educação', type: TransactionType.PAYABLE, icon: 'GraduationCap' },
  { id: 'exp-007', name: 'Contas Fixas', type: TransactionType.PAYABLE, icon: 'Zap' },
  { id: 'exp-008', name: 'Assinaturas', type: TransactionType.PAYABLE, icon: 'Tv' },
  { id: 'exp-999', name: 'Outras Despesas', type: TransactionType.PAYABLE, icon: 'Plus' },
  
  // RECEITAS (RECEIVABLE)
  { id: 'inc-001', name: 'Salário', type: TransactionType.RECEIVABLE, icon: 'DollarSign' },
  { id: 'inc-002', name: 'Vendas', type: TransactionType.RECEIVABLE, icon: 'ShoppingBag' },
  { id: 'inc-003', name: 'Freelance', type: TransactionType.RECEIVABLE, icon: 'Code' },
  { id: 'inc-004', name: 'Investimentos', type: TransactionType.RECEIVABLE, icon: 'TrendingUp' },
  { id: 'inc-005', name: 'Prêmios', type: TransactionType.RECEIVABLE, icon: 'Trophy' },
  { id: 'inc-999', name: 'Outras Receitas', type: TransactionType.RECEIVABLE, icon: 'Plus' },
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const RECURRENCE_LABELS: Record<string, string> = {
  NONE: 'Nenhuma',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual'
};
