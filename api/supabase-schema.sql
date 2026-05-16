create table if not exists public.app_users (
  id uuid primary key,
  name text not null,
  email text null,
  phone text null,
  password_hash text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

alter table public.app_users alter column email drop not null;
alter table public.app_users alter column phone drop not null;
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'app_users_email_key' and table_name = 'app_users'
  ) then
    alter table public.app_users drop constraint app_users_email_key;
  end if;
exception when others then
  null;
end $$;
drop index if exists idx_app_users_phone_unique;
create unique index if not exists idx_app_users_email_unique_not_null on public.app_users(email) where email is not null;
create unique index if not exists idx_app_users_phone_unique_not_null on public.app_users(phone) where phone is not null;

create table if not exists public.user_social_identities (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider text not null check (provider in ('google')),
  provider_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_user_id)
);

create index if not exists idx_user_social_identities_user on public.user_social_identities(user_id);

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
  planned_percent numeric(7,3) null check (planned_percent > 0 and planned_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month, category_id)
);

create index if not exists idx_budgets_user_month on public.budgets(user_id, month);
alter table public.budgets add column if not exists planned_percent numeric(7,3) null check (planned_percent > 0 and planned_percent <= 100);

create table if not exists public.budget_plans (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  month char(7) not null,
  methodology text not null check (methodology in ('percentage', 'envelope', 'zero_based')),
  total_income numeric(14,2) null check (total_income is null or total_income >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create index if not exists idx_budget_plans_user_month on public.budget_plans(user_id, month);

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

create table if not exists public.anomaly_alerts (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  transaction_id uuid null references public.transactions(id) on delete set null,
  type text not null check (
    type in (
      'high_transaction',
      'category_overspending',
      'spending_spike',
      'duplicate_transaction'
    )
  ),
  severity text not null check (severity in ('low', 'medium', 'high')),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz null
);

create index if not exists idx_anomaly_alerts_user_created on public.anomaly_alerts(user_id, created_at desc);
create index if not exists idx_anomaly_alerts_user_dismissed on public.anomaly_alerts(user_id, is_dismissed);
create index if not exists idx_anomaly_alerts_transaction on public.anomaly_alerts(transaction_id);

create table if not exists public.faqs (
  id uuid primary key,
  question text not null,
  answer text not null,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_faqs_active_created on public.faqs(is_active, created_at desc);

create table if not exists public.help_questions (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  response text null,
  responded_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_help_questions_user_created on public.help_questions(user_id, created_at desc);

insert into public.faqs (id, question, answer, tags, is_active)
values
  (
    '00000000-0000-0000-0000-00000000fa01',
    'How do I add a transaction?',
    'Open Transactions, tap Add transaction, fill amount/type/category/date/payment method, then save.',
    array['transactions', 'add'],
    true
  ),
  (
    '00000000-0000-0000-0000-00000000fa02',
    'Why does sync show pending items?',
    'Pending sync means you created or edited data while offline. Once online, tap Sync Now in Transactions.',
    array['offline', 'sync'],
    true
  ),
  (
    '00000000-0000-0000-0000-00000000fa03',
    'How are budget over-limit warnings calculated?',
    'Budget usage compares category spending in a month against planned category budget limits.',
    array['budgets', 'warnings'],
    true
  )
on conflict (id) do nothing;

create table if not exists public.receipts (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  image_url text null,
  ocr_raw_text text not null default '',
  extracted_amount numeric(14,2) null,
  extracted_merchant text null,
  extracted_date date null,
  linked_transaction_id uuid null references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_receipts_user_created on public.receipts(user_id, created_at desc);
create index if not exists idx_receipts_linked_transaction on public.receipts(linked_transaction_id);

create table if not exists public.app_notifications (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  type text not null check (
    type in (
      'bill_reminder',
      'budget_overspending',
      'goal_milestone',
      'recurring_reminder',
      'recurring_recorded',
      'anomaly_alert'
    )
  ),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text null,
  is_read boolean not null default false,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz null,
  dismissed_at timestamptz null
);

create index if not exists idx_notifications_user_created on public.app_notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_read on public.app_notifications(user_id, is_read, is_dismissed);
create unique index if not exists idx_notifications_user_dedupe on public.app_notifications(user_id, dedupe_key) where dedupe_key is not null;

create table if not exists public.statement_exports (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly')),
  reference_date date not null,
  start_date date not null,
  end_date date not null,
  file_name text not null,
  csv_content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_statement_exports_user_created on public.statement_exports(user_id, created_at desc);
