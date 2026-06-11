-- Add data integrity constraints to core tables

-- RFQ status constraints
ALTER TABLE rfqs 
  ADD CONSTRAINT chk_rfqs_status 
  CHECK (status IN ('active', 'closed', 'draft', 'archived'));

-- Vendor status constraints
ALTER TABLE vendors 
  ADD CONSTRAINT chk_vendors_status 
  CHECK (status IN (
    'discovered', 
    'calling', 
    'voicemail', 
    'responded', 
    'qualified', 
    'quoted', 
    'emailing', 
    'completed', 
    'no-response', 
    'declined'
  ));

-- Ensure unit_price is positive
ALTER TABLE vendors 
  ADD CONSTRAINT chk_vendors_unit_price 
  CHECK (unit_price IS NULL OR unit_price >= 0);

-- Ensure lead_time is positive
ALTER TABLE vendors 
  ADD CONSTRAINT chk_vendors_lead_time 
  CHECK (lead_time IS NULL OR lead_time > 0);

-- Ensure target_unit price is positive
ALTER TABLE rfqs 
  ADD CONSTRAINT chk_rfqs_target_unit 
  CHECK (target_unit IS NULL OR target_unit > 0);
