-- GLD-18: persist Vapi webhook events for live dashboard + post-call analysis
create table if not exists call_events (
  id bigserial primary key,
  call_id text,
  rfq_id text references rfqs(id) on delete cascade,
  vendor_id text references vendors(id) on delete cascade,
  event_type text not null,        -- 'status_update' | 'call_complete'
  status text,                     -- queued|ringing|in-progress|forwarding|ended (status_update only)
  payload jsonb not null,          -- parsed dashboard-ready dict from vapi.handle_webhook
  raw jsonb,                       -- full Vapi webhook envelope
  created_at timestamptz default now()
);

create index if not exists call_events_vendor_idx on call_events(vendor_id, created_at desc);
create index if not exists call_events_rfq_idx on call_events(rfq_id, created_at desc);
create index if not exists call_events_call_idx on call_events(call_id, created_at desc);

alter table call_events enable row level security;
create policy "anon read call_events" on call_events for select using (true);
