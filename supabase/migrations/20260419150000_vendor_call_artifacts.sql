-- GLD-21: persist Vapi end-of-call artifacts directly on vendors row
-- so the dashboard can render transcript + recording without joining call_events.
alter table vendors add column if not exists transcript text;
alter table vendors add column if not exists recording_url text;
alter table vendors add column if not exists email text;
alter table vendors add column if not exists payment_terms text;
