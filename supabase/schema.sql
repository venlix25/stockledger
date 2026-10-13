-- StockLedger Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS
create extension if not exists "uuid-ossp";

-- Customers table
create table if not exists customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz default now()
);

-- Invoices table
create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  invoice_number text not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('paid', 'pending', 'overdue')),
  due_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Payments table
create table if not exists payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  invoice_id uuid references invoices(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete cascade not null,
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  method text default 'cash',
  notes text,
  created_at timestamptz default now()
);

-- Row Level Security Policies
alter table customers enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;

-- Customers policies
create policy "Users can view own customers" on customers for select using (auth.uid() = user_id);
create policy "Users can insert own customers" on customers for insert with check (auth.uid() = user_id);
create policy "Users can update own customers" on customers for update using (auth.uid() = user_id);
create policy "Users can delete own customers" on customers for delete using (auth.uid() = user_id);

-- Invoices policies
create policy "Users can view own invoices" on invoices for select using (auth.uid() = user_id);
create policy "Users can insert own invoices" on invoices for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on invoices for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on invoices for delete using (auth.uid() = user_id);

-- Payments policies
create policy "Users can view own payments" on payments for select using (auth.uid() = user_id);
create policy "Users can insert own payments" on payments for insert with check (auth.uid() = user_id);
create policy "Users can update own payments" on payments for update using (auth.uid() = user_id);
create policy "Users can delete own payments" on payments for delete using (auth.uid() = user_id);

-- Auto-update invoice status to overdue
create or replace function update_overdue_invoices()
returns void as $$
  update invoices
  set status = 'overdue'
  where status = 'pending' and due_date < current_date;
$$ language sql;
