-- rfqs: one row per RFQ campaign
create table if not exists rfqs (
  id text primary key,
  title text not null,
  summary text,
  status text not null default 'active',
  created text,
  deadline text,
  quantity integer,
  material text,
  finish text,
  tolerance text,
  certifications text[],
  geography text,
  target_unit numeric(10,2),
  walk_away_unit numeric(10,2),
  max_lead_time_days integer,
  tone text,
  files jsonb default '[]',
  workspace_name text,
  workspace_initials text,
  current_user_name text,
  current_user_email text,
  current_user_initials text,
  created_at timestamptz default now()
);

-- vendors: one row per vendor on a campaign
create table if not exists vendors (
  id text primary key,
  rfq_id text references rfqs(id) on delete cascade,
  name text not null,
  location text,
  employees text,
  contact jsonb,
  status text not null default 'calling',
  unit_price numeric(10,2),
  lead_time integer,
  moq integer,
  nre numeric(10,2),
  certs text[],
  capabilities text[],
  risk text,
  fit_score integer,
  last_update text,
  call_duration text,
  call_outcome text,
  summary text,
  created_at timestamptz default now()
);

-- thread_events: ordered log of calls/emails/notes per vendor
create table if not exists thread_events (
  id bigserial primary key,
  vendor_id text references vendors(id) on delete cascade,
  rfq_id text references rfqs(id) on delete cascade,
  kind text not null, -- 'call' | 'email' | 'agent-note'
  who text,
  direction text,       -- 'in' | 'out' (emails only)
  "to" text,
  "from" text,
  subject text,
  body text,
  attachments text[],
  duration text,
  outcome text,
  transcript jsonb,
  event_time text,
  created_at timestamptz default now()
);

-- enable RLS but allow anon read (no auth for now)
alter table rfqs enable row level security;
alter table vendors enable row level security;
alter table thread_events enable row level security;

create policy "anon read rfqs"          on rfqs          for select using (true);
create policy "anon read vendors"       on vendors       for select using (true);
create policy "anon read thread_events" on thread_events for select using (true);
