-- Add performance indexes for foreign keys and common query patterns

CREATE INDEX IF NOT EXISTS idx_vendors_rfq_id ON vendors(rfq_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(status);

CREATE INDEX IF NOT EXISTS idx_thread_events_vendor_id ON thread_events(vendor_id);
CREATE INDEX IF NOT EXISTS idx_thread_events_rfq_id ON thread_events(rfq_id);
CREATE INDEX IF NOT EXISTS idx_thread_events_event_time ON thread_events(event_time);

CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_call_events_call_id ON call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_call_events_vendor_id ON call_events(vendor_id);
