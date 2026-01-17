
import { Category, TransactionType } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  // DESPESAS (PAYABLE) - UUIDs Estáticos
  { id: '11111111-1111-4111-a111-111111111111', name: 'Alimentação', type: TransactionType.PAYABLE, icon: 'Utensils' },
  { id: '22222222-2222-4222-a222-222222222222', name: 'Transporte', type: TransactionType.PAYABLE, icon: 'Car' },
  { id: '33333333-3333-4333-a333-333333333333', name: 'Moradia', type: TransactionType.PAYABLE, icon: 'Home' },
  { id: '44444444-4444-4444-a444-444444444444', name: 'Saúde', type: TransactionType.PAYABLE, icon: 'HeartPulse' },
  { id: '55555555-5555-4555-a555-555555555555', name: 'Lazer', type: TransactionType.PAYABLE, icon: 'Gamepad2' },
  { id: '66666666-6666-4666-a666-666666666666', name: 'Educação', type: TransactionType.PAYABLE, icon: 'GraduationCap' },
  { id: '77777777-7777-4777-a777-777777777777', name: 'Contas Fixas', type: TransactionType.PAYABLE, icon: 'Zap' },
  { id: '88888888-8888-4888-a888-888888888888', name: 'Assinaturas', type: TransactionType.PAYABLE, icon: 'Tv' },
  { id: '99999999-9999-4999-a999-999999999999', name: 'Outras Despesas', type: TransactionType.PAYABLE, icon: 'Plus' },
  
  // RECEITAS (RECEIVABLE) - UUIDs Estáticos
  { id: 'aaaaaaaa-aaaa-4aaa-baaa-aaaaaaaaaaaa', name: 'Salário', type: TransactionType.RECEIVABLE, icon: 'DollarSign' },
  { id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', name: 'Vendas', type: TransactionType.RECEIVABLE, icon: 'ShoppingBag' },
  { id: 'cccccccc-cccc-4ccc-bccc-cccccccccccc', name: 'Freelance', type: TransactionType.RECEIVABLE, icon: 'Code' },
  { id: 'dddddddd-dddd-4ddd-bddd-dddddddddddd', name: 'Investimentos', type: TransactionType.RECEIVABLE, icon: 'TrendingUp' },
  { id: 'eeeeeeee-eeee-4eee-beee-eeeeeeeeeeee', name: 'Prêmios', type: TransactionType.RECEIVABLE, icon: 'Trophy' },
  { id: 'ffffffff-ffff-4fff-bfff-ffffffffffff', name: 'Outras Receitas', type: TransactionType.RECEIVABLE, icon: 'Plus' },
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
