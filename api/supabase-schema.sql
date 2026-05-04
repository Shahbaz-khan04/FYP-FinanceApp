create table if not exists public.app_users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  phone text not null,
  password_hash text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_tokens_user_id on public.password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_token on public.password_reset_tokens(token);

create table if not exists public.categories (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'circle',
  color text not null default '#94A3B8',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories add column if not exists icon text not null default 'circle';
alter table public.categories add column if not exists color text not null default '#94A3B8';
alter table public.categories add column if not exists is_default boolean not null default false;

create unique index if not exists idx_categories_user_name_type
on public.categories(user_id, name, type);

create table if not exists public.transactions (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_id uuid null references public.categories(id) on delete set null,
  date date not null,
  currency char(3) not null,
  payment_method text not null,
  notes text null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_id_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_user_type_date on public.transactions(user_id, type, date desc);

create table if not exists public.budgets (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  month char(7) not null,
  category_id uuid not null references public.categories(id) on delete cascade,
  planned_amount numeric(14,2) not null check (planned_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category_id)
);

create index if not exists idx_budgets_user_month on public.budgets(user_id, month);

create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  title text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  saved_amount numeric(14,2) not null default 0 check (saved_amount >= 0),
  deadline date not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_goals_user_deadline on public.goals(user_id, deadline);

create table if not exists public.recurring_transactions (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid not null references public.categories(id) on delete cascade,
  frequency text not null check (frequency in ('weekly', 'monthly', 'custom')),
  custom_days int null check (custom_days is null or custom_days > 0),
  is_paused boolean not null default false,
  start_date date not null,
  next_run_date date not null,
  last_run_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_recurring_user_id on public.recurring_transactions(user_id);
create index if not exists idx_recurring_next_run on public.recurring_transactions(next_run_date);
