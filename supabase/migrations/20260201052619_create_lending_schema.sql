/*
  # Money Lending Application Schema

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Member name
      - `phone` (text, not null) - Phone number
      - `address` (text) - Address
      - `aadhaar_number` (text) - Aadhaar number
      - `created_at` (timestamptz) - Record creation timestamp
      
    - `loans`
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key) - References members
      - `loan_amount` (numeric, not null) - Requested loan amount
      - `amount_given` (numeric, not null) - Actual amount given to customer
      - `interest_percentage` (numeric, not null) - Interest rate
      - `collection_type` (text, not null) - daily/weekly/regular
      - `total_payable` (numeric, not null) - Total amount to be repaid (including interest)
      - `balance_remaining` (numeric, not null) - Remaining balance
      - `daily_amount` (numeric) - For daily collection type
      - `weekly_amount` (numeric) - For weekly collection type
      - `status` (text, not null) - active/closed
      - `start_date` (date, not null) - Loan start date
      - `last_payment_date` (date) - Last payment received date
      - `created_at` (timestamptz) - Record creation timestamp
      
    - `payments`
      - `id` (uuid, primary key)
      - `loan_id` (uuid, foreign key) - References loans
      - `amount_paid` (numeric, not null) - Total amount paid
      - `interest_paid` (numeric, not null) - Interest portion
      - `principal_paid` (numeric, not null) - Principal portion
      - `payment_date` (date, not null) - Date of payment
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage all data
*/

-- Modified members table to support single-insert logic
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text DEFAULT '',
  aadhaar_number text DEFAULT '',
  
  -- Added Loan details for single-table storage
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  collection_type text NOT NULL CHECK (collection_type IN ('daily', 'weekly', '10 days', 'monthly', 'regular')),
  loan_amount numeric NOT NULL DEFAULT 0,
  amount_given numeric NOT NULL DEFAULT 0,
  interest_percentage numeric NOT NULL DEFAULT 0,
  min_payment_amount numeric NOT NULL DEFAULT 0,
  total_payable numeric NOT NULL DEFAULT 0,
  balance_remaining numeric NOT NULL DEFAULT 0,
  daily_amount numeric,
  weekly_amount numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  
  created_at timestamptz DEFAULT now()
);

-- Keep existing loans table 
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  loan_amount numeric NOT NULL,
  amount_given numeric NOT NULL,
  interest_percentage numeric NOT NULL,
  collection_type text NOT NULL CHECK (collection_type IN ('daily', 'weekly', 'regular')),
  total_payable numeric NOT NULL,
  balance_remaining numeric NOT NULL,
  daily_amount numeric,
  weekly_amount numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  last_payment_date date,
  created_at timestamptz DEFAULT now()
);

-- Keep existing payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  interest_paid numeric NOT NULL,
  principal_paid numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Re-enable RLS and Policies (to ensure they apply to new columns)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on members" ON members;
CREATE POLICY "Allow all operations for authenticated users on members"
  ON members FOR ALL TO authenticated USING (true) WITH CHECK (true);