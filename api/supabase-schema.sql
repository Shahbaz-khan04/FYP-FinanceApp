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

create table if not exists public.push_tokens (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  expo_push_token text not null,
  device_name text null,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, expo_push_token)
);

create index if not exists idx_push_tokens_user_active on public.push_tokens(user_id, is_active);

create table if not exists public.ai_recommendation_runs (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  month char(7) not null,
  model text not null,
  prompt_version text not null default 'v1',
  result_json jsonb not null,
  created_at timestamptz not null default now(),
  unique(user_id, month, prompt_version)
);

create index if not exists idx_ai_recommendation_runs_user_month on public.ai_recommendation_runs(user_id, month);

-- Demo history seed for FYP showcase:
-- Populates the most recently created user with rich data for the past 2 months.
do $$
declare
  v_user_id uuid;
  v_now date := (now() at time zone 'utc')::date;
  v_month_0 text := to_char(date_trunc('month', v_now), 'YYYY-MM');
  v_month_1 text := to_char((date_trunc('month', v_now) - interval '1 month'), 'YYYY-MM');
  v_month_2 text := to_char((date_trunc('month', v_now) - interval '2 month'), 'YYYY-MM');
  v_start_m1 date := (date_trunc('month', v_now) - interval '1 month')::date;
  v_start_m2 date := (date_trunc('month', v_now) - interval '2 month')::date;

  c_salary uuid;
  c_freelance uuid;
  c_food uuid;
  c_transport uuid;
  c_rent uuid;
  c_bills uuid;
  c_shopping uuid;
  c_health uuid;
  c_entertainment uuid;
  c_business uuid;
begin
  select id into v_user_id
  from public.app_users
  order by created_at desc
  limit 1;

  if v_user_id is null then
    raise notice 'No app_users found. Seed skipped.';
    return;
  end if;

  select id into c_salary from public.categories where user_id = v_user_id and type = 'income' and name = 'Salary' limit 1;
  select id into c_freelance from public.categories where user_id = v_user_id and type = 'income' and name = 'Freelance' limit 1;
  select id into c_food from public.categories where user_id = v_user_id and type = 'expense' and name = 'Food' limit 1;
  select id into c_transport from public.categories where user_id = v_user_id and type = 'expense' and name = 'Transport' limit 1;
  select id into c_rent from public.categories where user_id = v_user_id and type = 'expense' and name = 'Rent' limit 1;
  select id into c_bills from public.categories where user_id = v_user_id and type = 'expense' and name = 'Bills' limit 1;
  select id into c_shopping from public.categories where user_id = v_user_id and type = 'expense' and name = 'Shopping' limit 1;
  select id into c_health from public.categories where user_id = v_user_id and type = 'expense' and name = 'Health' limit 1;
  select id into c_entertainment from public.categories where user_id = v_user_id and type = 'expense' and name = 'Entertainment' limit 1;
  select id into c_business from public.categories where user_id = v_user_id and type = 'expense' and name = 'Business' limit 1;

  -- Budget plans for last 2 months (methodology showcase)
  insert into public.budget_plans (id, user_id, month, methodology, total_income, created_at, updated_at)
  values
    (gen_random_uuid(), v_user_id, v_month_2, 'envelope', null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_1, 'zero_based', 4200, now(), now())
  on conflict (user_id, month) do update
  set methodology = excluded.methodology,
      total_income = excluded.total_income,
      updated_at = now();

  -- Category budgets for last 2 months
  insert into public.budgets (id, user_id, month, category_id, planned_amount, planned_percent, created_at, updated_at)
  values
    (gen_random_uuid(), v_user_id, v_month_2, c_food, 420, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_2, c_transport, 220, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_2, c_rent, 1200, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_2, c_bills, 300, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_2, c_shopping, 260, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_1, c_food, 450, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_1, c_transport, 250, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_1, c_rent, 1200, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_1, c_bills, 350, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_1, c_health, 280, null, now(), now()),
    (gen_random_uuid(), v_user_id, v_month_1, c_business, 500, null, now(), now())
  on conflict (user_id, month, category_id) do update
  set planned_amount = excluded.planned_amount,
      planned_percent = excluded.planned_percent,
      updated_at = now();

  -- Dense transaction history (2 past months + current month)
  insert into public.transactions (id, user_id, amount, type, category_id, date, currency, payment_method, notes, tags, created_at, updated_at)
  values
    -- month -2 incomes
    (gen_random_uuid(), v_user_id, 2500, 'income', c_salary, v_start_m2 + 0, 'USD', 'Bank Transfer', 'Monthly salary', array['salary'], now(), now()),
    (gen_random_uuid(), v_user_id, 650, 'income', c_freelance, v_start_m2 + 8, 'USD', 'Wise', 'Client website payment', array['freelance','client-a'], now(), now()),
    -- month -2 expenses
    (gen_random_uuid(), v_user_id, 1200, 'expense', c_rent, v_start_m2 + 1, 'USD', 'Bank Transfer', 'Apartment rent', array['fixed'], now(), now()),
    (gen_random_uuid(), v_user_id, 145, 'expense', c_food, v_start_m2 + 2, 'USD', 'Card', 'Groceries - supermarket', array['grocery'], now(), now()),
    (gen_random_uuid(), v_user_id, 48, 'expense', c_transport, v_start_m2 + 3, 'USD', 'Cash', 'Fuel refill', array['car'], now(), now()),
    (gen_random_uuid(), v_user_id, 96, 'expense', c_bills, v_start_m2 + 4, 'USD', 'Card', 'Electricity bill', array['utility'], now(), now()),
    (gen_random_uuid(), v_user_id, 72, 'expense', c_entertainment, v_start_m2 + 5, 'USD', 'Card', 'Streaming + cinema', array['lifestyle'], now(), now()),
    (gen_random_uuid(), v_user_id, 215, 'expense', c_shopping, v_start_m2 + 10, 'USD', 'Card', 'Clothes and essentials', array['shopping'], now(), now()),
    (gen_random_uuid(), v_user_id, 62, 'expense', c_health, v_start_m2 + 13, 'USD', 'Card', 'Pharmacy + vitamins', array['health'], now(), now()),
    (gen_random_uuid(), v_user_id, 105, 'expense', c_food, v_start_m2 + 16, 'USD', 'Card', 'Groceries - weekly stock', array['grocery'], now(), now()),
    (gen_random_uuid(), v_user_id, 38, 'expense', c_transport, v_start_m2 + 18, 'USD', 'Cash', 'Ride sharing', array['transport'], now(), now()),
    (gen_random_uuid(), v_user_id, 89, 'expense', c_bills, v_start_m2 + 22, 'USD', 'Card', 'Internet + mobile', array['utility'], now(), now()),
    (gen_random_uuid(), v_user_id, 310, 'expense', c_business, v_start_m2 + 24, 'USD', 'Card', 'Design tools + subscriptions', array['business'], now(), now()),

    -- month -1 incomes
    (gen_random_uuid(), v_user_id, 2500, 'income', c_salary, v_start_m1 + 0, 'USD', 'Bank Transfer', 'Monthly salary', array['salary'], now(), now()),
    (gen_random_uuid(), v_user_id, 720, 'income', c_freelance, v_start_m1 + 7, 'USD', 'Wise', 'Client maintenance retainer', array['freelance','client-b'], now(), now()),
    (gen_random_uuid(), v_user_id, 340, 'income', c_freelance, v_start_m1 + 19, 'USD', 'Payoneer', 'Small UI contract', array['freelance','client-c'], now(), now()),
    -- month -1 expenses
    (gen_random_uuid(), v_user_id, 1200, 'expense', c_rent, v_start_m1 + 1, 'USD', 'Bank Transfer', 'Apartment rent', array['fixed'], now(), now()),
    (gen_random_uuid(), v_user_id, 152, 'expense', c_food, v_start_m1 + 2, 'USD', 'Card', 'Groceries + snacks', array['grocery'], now(), now()),
    (gen_random_uuid(), v_user_id, 55, 'expense', c_transport, v_start_m1 + 3, 'USD', 'Cash', 'Fuel refill', array['car'], now(), now()),
    (gen_random_uuid(), v_user_id, 102, 'expense', c_bills, v_start_m1 + 4, 'USD', 'Card', 'Electricity bill', array['utility'], now(), now()),
    (gen_random_uuid(), v_user_id, 91, 'expense', c_entertainment, v_start_m1 + 6, 'USD', 'Card', 'Gaming + subscriptions', array['lifestyle'], now(), now()),
    (gen_random_uuid(), v_user_id, 244, 'expense', c_shopping, v_start_m1 + 9, 'USD', 'Card', 'Household + clothes', array['shopping'], now(), now()),
    (gen_random_uuid(), v_user_id, 74, 'expense', c_health, v_start_m1 + 12, 'USD', 'Card', 'Doctor visit', array['health'], now(), now()),
    (gen_random_uuid(), v_user_id, 168, 'expense', c_food, v_start_m1 + 14, 'USD', 'Card', 'Groceries - mid month', array['grocery'], now(), now()),
    (gen_random_uuid(), v_user_id, 42, 'expense', c_transport, v_start_m1 + 15, 'USD', 'Cash', 'Ride sharing', array['transport'], now(), now()),
    (gen_random_uuid(), v_user_id, 118, 'expense', c_bills, v_start_m1 + 21, 'USD', 'Card', 'Internet + mobile', array['utility'], now(), now()),
    (gen_random_uuid(), v_user_id, 690, 'expense', c_business, v_start_m1 + 23, 'USD', 'Card', 'Laptop repair + software annual', array['business'], now(), now()),
    (gen_random_uuid(), v_user_id, 295, 'expense', c_food, v_start_m1 + 26, 'USD', 'Card', 'Large family event groceries', array['event','grocery'], now(), now()),

    -- current month samples to keep dashboards lively
    (gen_random_uuid(), v_user_id, 2500, 'income', c_salary, date_trunc('month', v_now)::date + 0, 'USD', 'Bank Transfer', 'Monthly salary', array['salary'], now(), now()),
    (gen_random_uuid(), v_user_id, 180, 'expense', c_food, date_trunc('month', v_now)::date + 2, 'USD', 'Card', 'Groceries', array['grocery'], now(), now()),
    (gen_random_uuid(), v_user_id, 57, 'expense', c_transport, date_trunc('month', v_now)::date + 3, 'USD', 'Cash', 'Fuel', array['transport'], now(), now()),
    (gen_random_uuid(), v_user_id, 1200, 'expense', c_rent, date_trunc('month', v_now)::date + 1, 'USD', 'Bank Transfer', 'Apartment rent', array['fixed'], now(), now()),
    (gen_random_uuid(), v_user_id, 121, 'expense', c_bills, date_trunc('month', v_now)::date + 5, 'USD', 'Card', 'Utilities', array['utility'], now(), now());

  -- Goals
  insert into public.goals (id, user_id, title, target_amount, saved_amount, deadline, is_completed, created_at, updated_at)
  values
    (gen_random_uuid(), v_user_id, 'Emergency Fund', 6000, 2300, (v_now + interval '150 day')::date, false, now(), now()),
    (gen_random_uuid(), v_user_id, 'New Laptop', 1800, 1250, (v_now + interval '70 day')::date, false, now(), now()),
    (gen_random_uuid(), v_user_id, 'Vacation', 2500, 900, (v_now + interval '210 day')::date, false, now(), now())
  on conflict do nothing;

  -- Recurring transactions
  insert into public.recurring_transactions
    (id, user_id, amount, category_id, frequency, custom_days, is_paused, start_date, next_run_date, last_run_date, created_at, updated_at)
  values
    (gen_random_uuid(), v_user_id, 1200, c_rent, 'monthly', null, false, v_start_m2, (date_trunc('month', v_now) + interval '1 day')::date, (date_trunc('month', v_now) - interval '1 month' + interval '1 day')::date, now(), now()),
    (gen_random_uuid(), v_user_id, 100, c_bills, 'monthly', null, false, v_start_m2 + 4, (date_trunc('month', v_now) + interval '5 day')::date, (date_trunc('month', v_now) - interval '1 month' + interval '5 day')::date, now(), now()),
    (gen_random_uuid(), v_user_id, 55, c_transport, 'weekly', null, false, v_start_m2 + 3, (v_now + interval '2 day')::date, (v_now - interval '5 day')::date, now(), now())
  on conflict do nothing;

  -- Anomaly alerts samples
  insert into public.anomaly_alerts
    (id, user_id, transaction_id, type, severity, title, message, metadata, is_dismissed, created_at, dismissed_at)
  values
    (gen_random_uuid(), v_user_id, null, 'spending_spike', 'medium', 'Monthly spending spike', 'Your spending in the current month is above normal trend.', '{"month":"current"}'::jsonb, false, now() - interval '2 day', null),
    (gen_random_uuid(), v_user_id, null, 'category_overspending', 'high', 'Food category overspending', 'Food expenses are significantly above your baseline.', '{"category":"Food"}'::jsonb, false, now() - interval '1 day', null)
  on conflict do nothing;

  -- Notifications samples
  insert into public.app_notifications
    (id, user_id, type, title, message, metadata, dedupe_key, is_read, is_dismissed, created_at, read_at, dismissed_at)
  values
    (gen_random_uuid(), v_user_id, 'budget_overspending', 'Budget overspending alert', 'Food exceeded monthly budget by 85.00.', '{"category":"Food"}'::jsonb, 'demo-budget-food-' || v_month_1, false, false, now() - interval '1 day', null, null),
    (gen_random_uuid(), v_user_id, 'goal_milestone', 'Goal milestone reached', 'New Laptop: reached 69% progress.', '{"goal":"New Laptop"}'::jsonb, 'demo-goal-laptop', false, false, now() - interval '20 hours', null, null),
    (gen_random_uuid(), v_user_id, 'bill_reminder', 'Bill reminder', 'Utilities are due tomorrow.', '{"nextRun":"tomorrow"}'::jsonb, 'demo-bill-' || v_month_0, false, false, now() - interval '8 hours', null, null)
  on conflict do nothing;

  -- Receipts samples
  insert into public.receipts
    (id, user_id, image_url, ocr_raw_text, extracted_amount, extracted_merchant, extracted_date, linked_transaction_id, created_at, updated_at)
  values
    (gen_random_uuid(), v_user_id, 'https://images.unsplash.com/photo-1556740749-887f6717d7e4', 'Total 152.00\nMerchant SuperMart\nDate', 152, 'SuperMart', v_start_m1 + 2, null, now() - interval '28 day', now() - interval '28 day'),
    (gen_random_uuid(), v_user_id, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3', 'Total 102.00\nMerchant Utility Office\nDate', 102, 'Utility Office', v_start_m1 + 4, null, now() - interval '26 day', now() - interval '26 day')
  on conflict do nothing;

  -- Statement archive samples
  insert into public.statement_exports
    (id, user_id, period_type, reference_date, start_date, end_date, file_name, csv_content, created_at)
  values
    (gen_random_uuid(), v_user_id, 'monthly', (date_trunc('month', v_now) - interval '1 month')::date, v_start_m1, (date_trunc('month', v_now) - interval '1 day')::date,
      'statement_monthly_' || v_month_1 || '.csv',
      'Statement Type,MONTHLY
Reference Date,' || (date_trunc('month', v_now) - interval '1 month')::date || '
Range Start,' || v_start_m1 || '
Range End,' || (date_trunc('month', v_now) - interval '1 day')::date || '
Currency,USD',
      now() - interval '3 day'),
    (gen_random_uuid(), v_user_id, 'weekly', (v_now - interval '7 day')::date, (v_now - interval '13 day')::date, (v_now - interval '7 day')::date,
      'statement_weekly_recent.csv',
      'Statement Type,WEEKLY
Reference Date,' || (v_now - interval '7 day')::date || '
Range Start,' || (v_now - interval '13 day')::date || '
Range End,' || (v_now - interval '7 day')::date || '
Currency,USD',
      now() - interval '2 day')
  on conflict do nothing;

  -- AI recommendation cache sample
  insert into public.ai_recommendation_runs
    (id, user_id, month, model, prompt_version, result_json, created_at)
  values
    (
      gen_random_uuid(),
      v_user_id,
      v_month_1,
      'openai:gpt-4.1-mini',
      'v1',
      jsonb_build_object(
        'summary', 'You had strong income but category variance suggests tighter food and business spend controls.',
        'recommendations', jsonb_build_array(
          jsonb_build_object('title', 'Cap food spending weekly', 'message', 'Set a weekly food cap and track daily.', 'action', 'Create a weekly envelope for food at 110 USD.', 'priority', 'high'),
          jsonb_build_object('title', 'Stagger business purchases', 'message', 'Split large business expenses across billing cycles.', 'action', 'Move non-urgent software renewals to next month.', 'priority', 'medium'),
          jsonb_build_object('title', 'Boost laptop goal contributions', 'message', 'You are close to your laptop target.', 'action', 'Increase monthly savings by 120 USD for this goal.', 'priority', 'medium')
        ),
        'baseRecommendations', jsonb_build_array()
      ),
      now() - interval '1 day'
    )
  on conflict (user_id, month, prompt_version) do update
  set result_json = excluded.result_json,
      model = excluded.model,
      created_at = excluded.created_at;

  raise notice 'Demo seed applied for user %', v_user_id;
end $$;
