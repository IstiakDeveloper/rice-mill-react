// resources/js/types/index.d.ts
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
  }

  export interface Auth {
    user: User;
  }

  export interface PageProps {
    auth: Auth;
    errors: Record<string, string>;
    [key: string]: any;
  }

  export interface Customer {
    id: number;
    name: string;
    area: string;
    phone_number: string;
    image: string | null;
    created_at: string;
    updated_at: string;
  }

  export interface Season {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
  }

  export interface SackType {
    id: number;
    name: string;
    price: number;
    created_at: string;
    updated_at: string;
  }

  export interface TransactionItem {
    id: number;
    transaction_id: number;
    sack_type_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
    updated_at: string;
    sack_type?: SackType;
  }

  export interface Transaction {
    id: number;
    customer_id: number;
    season_id: number;
    transaction_date: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: 'paid' | 'partial' | 'due';
    notes: string | null;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    season?: Season;
    items?: TransactionItem[];
    payments?: Payment[];
  }

  export interface Payment {
    id: number;
    customer_id: number;
    transaction_id: number | null;
    season_id: number;
    payment_date: string;
    amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    customer?: Customer;
    transaction?: Transaction | null;
    season?: Season;
  }
