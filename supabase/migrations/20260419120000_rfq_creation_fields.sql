-- GLD-9: fields captured by the RFQ creation form
alter table rfqs add column if not exists location text;
alter table rfqs add column if not exists product_category text;
alter table rfqs add column if not exists budget_min numeric(12,2);
alter table rfqs add column if not exists budget_max numeric(12,2);
alter table rfqs add column if not exists timeline_weeks integer;

-- RLS is already enabled in the initial migration; re-asserting is idempotent
-- and makes the insert policy's effect unambiguous if this migration is read standalone.
alter table rfqs enable row level security;

-- MVP: no auth layer - open anon insert is intentional (PM-signed off, hackathon scope).
create policy "anon insert rfqs" on rfqs for insert with check (true);

