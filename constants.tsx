
import { Category, TransactionType } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  // DESPESAS
  { id: 'c1', name: 'Alimentação', type: TransactionType.PAYABLE, icon: 'Utensils' },
  { id: 'c2', name: 'Transporte', type: TransactionType.PAYABLE, icon: 'Car' },
  { id: 'c3', name: 'Moradia (Aluguel/Cond)', type: TransactionType.PAYABLE, icon: 'Home' },
  { id: 'c4', name: 'Saúde', type: TransactionType.PAYABLE, icon: 'HeartPulse' },
  { id: 'c5', name: 'Lazer', type: TransactionType.PAYABLE, icon: 'Gamepad2' },
  { id: 'c6', name: 'Educação', type: TransactionType.PAYABLE, icon: 'GraduationCap' },
  { id: 'c7', name: 'Contas (Luz/Água/Internet)', type: TransactionType.PAYABLE, icon: 'Zap' },
  { id: 'c8', name: 'Assinaturas', type: TransactionType.PAYABLE, icon: 'Tv' },
  { id: 'c9', name: 'Outros', type: TransactionType.PAYABLE, icon: 'Plus' },
  
  // RECEITAS
  { id: 'r1', name: 'Salário', type: TransactionType.RECEIVABLE, icon: 'DollarSign' },
  { id: 'r2', name: 'Vendas', type: TransactionType.RECEIVABLE, icon: 'ShoppingBag' },
  { id: 'r3', name: 'Freelance', type: TransactionType.RECEIVABLE, icon: 'Code' },
  { id: 'r4', name: 'Investimentos', type: TransactionType.RECEIVABLE, icon: 'TrendingUp' },
  { id: 'r5', name: 'Prêmios/Bônus', type: TransactionType.RECEIVABLE, icon: 'Trophy' },
  { id: 'r6', name: 'Reembolsos', type: TransactionType.RECEIVABLE, icon: 'CornerUpLeft' },
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
