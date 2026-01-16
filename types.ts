
export enum TransactionType {
  PAYABLE = 'PAYABLE',
  RECEIVABLE = 'RECEIVABLE'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  RECEIVED = 'RECEIVED',
  OVERDUE = 'OVERDUE'
}

export enum RecurrenceType {
  NONE = 'NONE',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUAL = 'SEMIANNUAL',
  ANNUAL = 'ANNUAL'
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  dueDate: string; // ISO format YYYY-MM-DD
  categoryId: string;
  status: TransactionStatus;
  recurrenceId?: string;
  installment?: number;
  totalInstallments?: number;
}

export interface User {
  name: string;
  email: string;
  password?: string;
  isLoggedIn: boolean;
}
