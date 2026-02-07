export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          name: string;
          phone: string;
          address: string;
          aadhaar_number: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          address?: string;
          aadhaar_number?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          address?: string;
          aadhaar_number?: string;
          created_at?: string;
        };
      };
      loans: {
        Row: {
          id: string;
          member_id: string;
          loan_amount: number;
          amount_given: number;
          interest_percentage: number;
          collection_type: 'daily' | 'weekly' | 'regular';
          total_payable: number;
          balance_remaining: number;
          daily_amount: number | null;
          weekly_amount: number | null;
          status: 'active' | 'closed';
          start_date: string;
          last_payment_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          loan_amount: number;
          amount_given: number;
          interest_percentage: number;
          collection_type: 'daily' | 'weekly' | 'regular';
          total_payable: number;
          balance_remaining: number;
          daily_amount?: number | null;
          weekly_amount?: number | null;
          status?: 'active' | 'closed';
          start_date?: string;
          last_payment_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          loan_amount?: number;
          amount_given?: number;
          interest_percentage?: number;
          collection_type?: 'daily' | 'weekly' | 'regular';
          total_payable?: number;
          balance_remaining?: number;
          daily_amount?: number | null;
          weekly_amount?: number | null;
          status?: 'active' | 'closed';
          start_date?: string;
          last_payment_date?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          loan_id: string;
          amount_paid: number;
          interest_paid: number;
          principal_paid: number;
          payment_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          loan_id: string;
          amount_paid: number;
          interest_paid: number;
          principal_paid: number;
          payment_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          loan_id?: string;
          amount_paid?: number;
          interest_paid?: number;
          principal_paid?: number;
          payment_date?: string;
          created_at?: string;
        };
      };
    };
  };
}
