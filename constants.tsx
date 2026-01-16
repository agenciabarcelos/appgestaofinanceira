
import { Category, TransactionType } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  // DESPESAS
  { id: '11111111-1111-4111-a111-111111111101', name: 'Alimentação', type: TransactionType.PAYABLE, icon: 'Utensils' },
  { id: '11111111-1111-4111-a111-111111111102', name: 'Transporte', type: TransactionType.PAYABLE, icon: 'Car' },
  { id: '11111111-1111-4111-a111-111111111103', name: 'Moradia (Aluguel/Cond)', type: TransactionType.PAYABLE, icon: 'Home' },
  { id: '11111111-1111-4111-a111-111111111104', name: 'Saúde', type: TransactionType.PAYABLE, icon: 'HeartPulse' },
  { id: '11111111-1111-4111-a111-111111111105', name: 'Lazer', type: TransactionType.PAYABLE, icon: 'Gamepad2' },
  { id: '11111111-1111-4111-a111-111111111106', name: 'Educação', type: TransactionType.PAYABLE, icon: 'GraduationCap' },
  { id: '11111111-1111-4111-a111-111111111107', name: 'Contas (Luz/Água/Internet)', type: TransactionType.PAYABLE, icon: 'Zap' },
  { id: '11111111-1111-4111-a111-111111111108', name: 'Assinaturas', type: TransactionType.PAYABLE, icon: 'Tv' },
  { id: '11111111-1111-4111-a111-111111111109', name: 'Outros', type: TransactionType.PAYABLE, icon: 'Plus' },
  
  // RECEITAS
  { id: '22222222-2222-4222-b222-222222222201', name: 'Salário', type: TransactionType.RECEIVABLE, icon: 'DollarSign' },
  { id: '22222222-2222-4222-b222-222222222202', name: 'Vendas', type: TransactionType.RECEIVABLE, icon: 'ShoppingBag' },
  { id: '22222222-2222-4222-b222-222222222203', name: 'Freelance', type: TransactionType.RECEIVABLE, icon: 'Code' },
  { id: '22222222-2222-4222-b222-222222222204', name: 'Investimentos', type: TransactionType.RECEIVABLE, icon: 'TrendingUp' },
  { id: '22222222-2222-4222-b222-222222222205', name: 'Prêmios/Bônus', type: TransactionType.RECEIVABLE, icon: 'Trophy' },
  { id: '22222222-2222-4222-b222-222222222206', name: 'Reembolsos', type: TransactionType.RECEIVABLE, icon: 'CornerUpLeft' },
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
