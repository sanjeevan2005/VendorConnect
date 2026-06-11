-- GLD-13: expanded RFQ fields for voice-AI negotiation context
alter table rfqs add column if not exists product_description text;
alter table rfqs add column if not exists unit_of_measure text;
alter table rfqs add column if not exists target_unit_price numeric(12,4);
alter table rfqs add column if not exists delivery_destination text;
alter table rfqs add column if not exists payment_terms text;
alter table rfqs add column if not exists sample_required boolean default false;
alter table rfqs add column if not exists recurring boolean default false;
-- certifications column already exists from initial migration (text[])
