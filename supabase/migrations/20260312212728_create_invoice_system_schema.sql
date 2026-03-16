/*
  # Invoice Management System - Database Schema

  ## Overview
  Complete invoice management system with clients, products, invoices, and payments tracking.

  ## New Tables

  ### 1. `companies`
  Company/business information for branding invoices
  - `id` (uuid, primary key)
  - `name` (text) - Company name
  - `email` (text) - Company email
  - `phone` (text) - Contact phone
  - `address` (text) - Business address
  - `city` (text)
  - `state` (text)
  - `zip` (text)
  - `country` (text)
  - `logo_url` (text) - URL to company logo
  - `tax_id` (text) - Tax/VAT ID
  - `website` (text)
  - `user_id` (uuid, foreign key) - Owner of the company
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `clients`
  Customer/client information
  - `id` (uuid, primary key)
  - `name` (text) - Client name
  - `email` (text) - Client email
  - `phone` (text)
  - `address` (text)
  - `city` (text)
  - `state` (text)
  - `zip` (text)
  - `country` (text)
  - `company_id` (uuid, foreign key) - Associated company
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `products`
  Products and services for invoicing
  - `id` (uuid, primary key)
  - `name` (text) - Product/service name
  - `description` (text)
  - `price` (decimal) - Unit price
  - `tax_rate` (decimal) - Default tax rate percentage
  - `unit` (text) - Unit of measurement (hours, items, etc.)
  - `company_id` (uuid, foreign key)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `invoices`
  Invoice header information
  - `id` (uuid, primary key)
  - `invoice_number` (text, unique) - Auto-generated invoice number
  - `company_id` (uuid, foreign key)
  - `client_id` (uuid, foreign key)
  - `issue_date` (date) - Invoice issue date
  - `due_date` (date) - Payment due date
  - `status` (text) - draft, sent, paid, overdue, cancelled
  - `subtotal` (decimal) - Amount before tax
  - `tax_amount` (decimal) - Total tax
  - `discount_amount` (decimal) - Discount applied
  - `total` (decimal) - Final amount
  - `notes` (text) - Invoice notes
  - `terms` (text) - Payment terms
  - `is_recurring` (boolean) - Recurring invoice flag
  - `recurring_frequency` (text) - monthly, quarterly, yearly
  - `next_invoice_date` (date) - Next recurring invoice date
  - `paid_at` (timestamptz) - Payment timestamp
  - `sent_at` (timestamptz) - When invoice was sent
  - `viewed_at` (timestamptz) - When client viewed invoice
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `invoice_items`
  Line items for each invoice
  - `id` (uuid, primary key)
  - `invoice_id` (uuid, foreign key)
  - `product_id` (uuid, foreign key, nullable) - Reference to product
  - `description` (text) - Item description
  - `quantity` (decimal) - Quantity
  - `unit_price` (decimal) - Price per unit
  - `tax_rate` (decimal) - Tax rate percentage
  - `amount` (decimal) - Line total (quantity * unit_price)
  - `created_at` (timestamptz)

  ### 6. `payments`
  Payment tracking for invoices
  - `id` (uuid, primary key)
  - `invoice_id` (uuid, foreign key)
  - `amount` (decimal) - Payment amount
  - `payment_date` (date) - Date of payment
  - `payment_method` (text) - card, bank_transfer, cash, etc.
  - `transaction_id` (text) - External payment reference
  - `notes` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access data associated with their companies
  - Policies check company ownership through user_id or company_id

  ## Indexes
  - Fast lookups for invoice numbers
  - Efficient filtering by status and dates
  - Client and company relationships
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  country text,
  logo_url text,
  tax_id text,
  website text,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  country text,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10, 2) NOT NULL DEFAULT 0,
  tax_rate decimal(5, 2) DEFAULT 0,
  unit text DEFAULT 'item',
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  subtotal decimal(10, 2) DEFAULT 0,
  tax_amount decimal(10, 2) DEFAULT 0,
  discount_amount decimal(10, 2) DEFAULT 0,
  total decimal(10, 2) DEFAULT 0,
  notes text,
  terms text,
  is_recurring boolean DEFAULT false,
  recurring_frequency text,
  next_invoice_date date,
  paid_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  CONSTRAINT valid_frequency CHECK (recurring_frequency IS NULL OR recurring_frequency IN ('monthly', 'quarterly', 'yearly'))
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity decimal(10, 2) NOT NULL DEFAULT 1,
  unit_price decimal(10, 2) NOT NULL DEFAULT 0,
  tax_rate decimal(5, 2) DEFAULT 0,
  amount decimal(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount decimal(10, 2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'other',
  transaction_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('card', 'bank_transfer', 'cash', 'check', 'other'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Clients policies
CREATE POLICY "Users can view clients from their companies"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = clients.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert clients to their companies"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = clients.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients in their companies"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = clients.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = clients.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clients from their companies"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = clients.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Products policies
CREATE POLICY "Users can view products from their companies"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = products.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to their companies"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = products.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in their companies"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = products.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = products.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from their companies"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = products.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Invoices policies
CREATE POLICY "Users can view invoices from their companies"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoices to their companies"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices in their companies"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices from their companies"
  ON invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies
      WHERE companies.id = invoices.company_id
      AND companies.user_id = auth.uid()
    )
  );

-- Invoice items policies
CREATE POLICY "Users can view invoice items from their invoices"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = invoice_items.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoice items to their invoices"
  ON invoice_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = invoice_items.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoice items in their invoices"
  ON invoice_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = invoice_items.invoice_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = invoice_items.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoice items from their invoices"
  ON invoice_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = invoice_items.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view payments for their invoices"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = payments.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert payments for their invoices"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = payments.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update payments for their invoices"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = payments.invoice_id
      AND companies.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = payments.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete payments from their invoices"
  ON payments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      JOIN companies ON companies.id = invoices.company_id
      WHERE invoices.id = payments.invoice_id
      AND companies.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();