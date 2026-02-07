/*
  # Fix RLS Policies for Public Access

  1. Security
    - Update RLS policies to allow public read access
    - Keep write operations restricted to authenticated users
*/

DROP POLICY IF EXISTS "Allow all operations for authenticated users on members" ON members;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on loans" ON loans;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on payments" ON payments;

CREATE POLICY "Public can read members"
  ON members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete members"
  ON members FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Public can read loans"
  ON loans FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete loans"
  ON loans FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Public can read payments"
  ON payments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);
