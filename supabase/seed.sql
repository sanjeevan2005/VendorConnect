-- Seed: VendrSurf demo data (CNC aluminum enclosures RFQ)

insert into rfqs (
  id, title, summary, status, created, deadline,
  quantity, material, finish, tolerance,
  certifications, geography,
  target_unit, walk_away_unit, max_lead_time_days, tone,
  files,
  workspace_name, workspace_initials,
  current_user_name, current_user_email, current_user_initials
) values (
  'RFQ-2026-0042',
  'CNC-machined aluminum enclosures',
  '500 units - 6061-T6 - anodized - IP65-rated',
  'active',
  'Apr 17, 2026',
  'May 22, 2026',
  500,
  'Aluminum 6061-T6',
  'Type II clear anodize, bead-blast #180',
  '+/-0.05 mm on mating features, +/-0.1 mm general',
  array['ISO 9001', 'RoHS'],
  'North America preferred; Asia acceptable for qty >500',
  42.00,
  58.00,
  35,
  'balanced',
  '[
    {"name":"enclosure_v7.step","size":"2.4 MB","kind":"STEP"},
    {"name":"drawing_REV-C.pdf","size":"412 KB","kind":"PDF"},
    {"name":"BOM_with_fasteners.xlsx","size":"38 KB","kind":"XLS"},
    {"name":"reference_assembly.jpg","size":"1.1 MB","kind":"IMG"}
  ]'::jsonb,
  'Blackbird Robotics', 'BR',
  'Sam Patel', 'sam@blackbird-robotics.com', 'SP'
) on conflict (id) do nothing;

-- Vendors
insert into vendors (id, rfq_id, name, location, employees, contact, status, unit_price, lead_time, moq, nre, certs, capabilities, risk, fit_score, last_update, call_duration, call_outcome, summary) values
('v-01','RFQ-2026-0042','Precision Machine Works','Torrance, CA','45-60',
  '{"name":"Diane Reyes","role":"VP Sales","linkedin":"in/dianereyes-pmw","phone":"(310) 555-0134","email":"d.reyes@pmw-cnc.com"}'::jsonb,
  'quoted',41.20,28,100,1850.00,
  array['ISO 9001','ITAR','AS9100'],
  array['5-axis CNC','Anodizing in-house','First-article inspection'],
  'low',94,'2m ago','4:18','Qualified',
  'Strong fit. In-house anodizing, AS9100, has capacity in their 5-axis cell.'),

('v-02','RFQ-2026-0042','Sierra Custom Metals','Reno, NV','80-100',
  '{"name":"Marcus Yun","role":"BD Lead","linkedin":"in/marcusyun","phone":"(775) 555-0188","email":"m.yun@sierracustom.com"}'::jsonb,
  'quoted',38.90,35,250,2400.00,
  array['ISO 9001'],
  array['3-axis + 5-axis','Outsourced anodize'],
  'low',88,'7m ago','3:42','Qualified',
  'Lowest quote. Anodizing outsourced - adds 4 days to lead time.'),

('v-03','RFQ-2026-0042','Foshan Precision MFG','Foshan, CN','200+',
  '{"name":"Wei Chen","role":"Account Manager","linkedin":"in/weichen-fpm","phone":"+86 757 8812 4410","email":"w.chen@foshan-precision.cn"}'::jsonb,
  'quoted',26.40,42,500,900.00,
  array['ISO 9001','IATF 16949'],
  array['5-axis CNC','Full anodizing line','Export to NA'],
  'medium',81,'14m ago','5:51','Qualified',
  'Cheapest unit price. Geography flagged per guardrail (NA preferred).'),

('v-04','RFQ-2026-0042','Cascade Tooling Co.','Portland, OR','20-30',
  '{"name":"Alex Tran","role":"Owner / Sales","linkedin":"in/alextran-cascade","phone":"(503) 555-0162","email":"alex@cascadetooling.com"}'::jsonb,
  'emailing',null,null,null,null,
  array['ISO 9001'],
  array['5-axis CNC','Anodize partner'],
  'low',79,'just now','3:08','Qualified - awaiting formal quote',
  'Qualified on call. Formal quote requested via email; agent is negotiating MOQ.'),

('v-05','RFQ-2026-0042','Summit CNC','Denver, CO','15-20',
  '{"name":"Priya Desai","role":"Sales Manager","linkedin":"in/priyadesai-summit","phone":"(720) 555-0199","email":"p.desai@summitcnc.com"}'::jsonb,
  'calling',null,null,null,null,
  array['ISO 9001'],
  array['3-axis CNC','Small-batch specialist'],
  'unknown',72,'live','0:47','In progress',
  'Call in progress - discussing capacity for 500-unit run.'),

('v-06','RFQ-2026-0042','Northgate Fabrication','Hamilton, ON','60-80',
  '{"name":"Owen Walsh","role":"Director of Sales","linkedin":"in/owenwalsh","phone":"(905) 555-0143","email":"o.walsh@northgatefab.ca"}'::jsonb,
  'voicemail',null,null,null,null,
  array['ISO 9001','ITAR'],
  array['5-axis CNC','Type III anodize'],
  'unknown',85,'21m ago','0:32','Voicemail left',
  'No pickup. Voicemail left with callback info; followup email queued.'),

('v-07','RFQ-2026-0042','Ironwood Machining','Austin, TX','30-40',
  '{"name":"Jenna Kowalski","role":"VP Operations","linkedin":"in/jennakowalski","phone":"(512) 555-0176","email":"j.kowalski@ironwoodmfg.com"}'::jsonb,
  'declined',null,null,null,null,
  array[]::text[],
  array['3-axis CNC'],
  '-',64,'32m ago','1:54','No capacity this quarter',
  'Booked through Q3. Passed - follow up in August.'),

('v-08','RFQ-2026-0042','Midwest Precision','Cleveland, OH','50-70',
  '{"name":"Tom Beckett","role":"Sales Director","linkedin":"in/tombeckett-mwp","phone":"(216) 555-0155","email":"t.beckett@midwest-precision.com"}'::jsonb,
  'declined',null,null,null,null,
  array['ISO 9001'],
  array['5-axis CNC'],
  '-',77,'44m ago','2:12','Not a fit - no anodize partner',
  'Declined. Would need us to handle finishing separately; violates spec.'),

('v-09','RFQ-2026-0042','Kinetic Metalworks','San Diego, CA','25-35',
  '{"name":"Rita Oduya","role":"Sales Lead","linkedin":"in/ritaoduya","phone":"(619) 555-0109","email":"r.oduya@kinetic-metal.com"}'::jsonb,
  'calling',null,null,null,null,
  array['ISO 9001'],
  array['5-axis CNC','Light anodize'],
  'unknown',83,'live','1:23','In progress',
  'Call in progress - confirming tolerance capability on thin walls.'),

('v-10','RFQ-2026-0042','Dongguan Sunrise Metals','Dongguan, CN','150+',
  '{"name":"Lily Wang","role":"Export Sales","linkedin":"in/lilywang-sunrise","phone":"+86 769 2280 1188","email":"l.wang@sunrisemetal.cn"}'::jsonb,
  'emailing',null,null,null,null,
  array['ISO 9001','IATF 16949'],
  array['5-axis CNC','In-house anodize'],
  'medium',78,'5m ago','4:05','Qualified - quote pending',
  'Asked for 3D file; agent sent STEP + drawing. Awaiting quote.'),

('v-11','RFQ-2026-0042','Rockford CNC','Rockford, IL','40-50',
  '{"name":"Brandon Hale","role":"VP Sales","linkedin":"in/brandonhale-rockford","phone":"(815) 555-0181","email":"b.hale@rockfordcnc.com"}'::jsonb,
  'voicemail',null,null,null,null,
  array['ISO 9001'],
  array['3-axis + 5-axis','Anodize partner'],
  'unknown',76,'17m ago','0:28','Voicemail - no callback window',
  'Left voicemail. Second attempt scheduled for tomorrow 10am.'),

('v-12','RFQ-2026-0042','BluePeak Manufacturing','Boise, ID','20-30',
  '{"name":"Karl Nguyen","role":"Owner","linkedin":"in/karlnguyen","phone":"(208) 555-0170","email":"karl@bluepeakmfg.com"}'::jsonb,
  'qualified',null,null,null,null,
  array['ISO 9001'],
  array['5-axis CNC','Specialty anodize'],
  'low',86,'1m ago','6:02','Qualified',
  'Strong fit. Owner-operated; quote expected within 24h.')

on conflict (id) do nothing;

-- Thread events for v-01 (Precision Machine Works)
insert into thread_events (vendor_id, rfq_id, kind, who, direction, "to", "from", subject, body, attachments, duration, outcome, transcript, event_time) values

('v-01','RFQ-2026-0042','call','agent',null,null,null,null,null,
  null,'4:18','Qualified',
  '[
    {"t":"00:00","who":"Agent","side":"agent","line":"Hi, this is Mia from VendrSurf calling on behalf of Blackbird Robotics. Is Diane available?"},
    {"t":"00:04","who":"Diane","side":"them","line":"This is Diane, what can I do for you?"},
    {"t":"00:07","who":"Agent","side":"agent","line":"Blackbird is sourcing a run of 500 CNC-machined aluminum enclosures - 6061-T6, Type II clear anodize, IP65-rated. Is that something Precision could quote?"},
    {"t":"00:18","who":"Diane","side":"them","line":"500 units, anodize in-house? Yeah, that''s right in our wheelhouse. What''s the complexity - single-piece or multi-part assembly?"},
    {"t":"00:26","who":"Agent","side":"agent","line":"Single piece, approx 140 x 90 x 55 millimeters, 14 features including press-fit inserts. Wall thickness 2.5 to 4 millimeters. I can send the STEP and drawing after this call."},
    {"t":"00:42","who":"Diane","side":"them","line":"Got it. Ballpark - on 500 units at that size with Type II clear, we''re probably looking at the low forties unit, maybe high thirties if we batch the anodize. Lead time four-ish weeks after PO."},
    {"t":"00:58","who":"Agent","side":"agent","line":"That works against our target. Tolerance on mating features is +/-0.05 millimeters - any issue holding that on your 5-axis?"},
    {"t":"01:10","who":"Diane","side":"them","line":"No problem. We hold tenths on that class all day."},
    {"t":"01:14","who":"Agent","side":"agent","line":"Great. Are you AS9100 certified? We saw it listed but want to confirm it''s current."},
    {"t":"01:22","who":"Diane","side":"them","line":"Yes, renewed in February. I''ll include the cert in the quote packet."},
    {"t":"01:28","who":"Agent","side":"agent","line":"Perfect. I''ll email the full RFQ packet - STEP, drawing revision C, BOM, spec sheet - within the next few minutes. Can we get a formal quote back by Monday?"},
    {"t":"01:40","who":"Diane","side":"them","line":"Monday EOD works. Anything over 500 and we can usually bring the unit price down a couple dollars - mention that if they''re flexible."},
    {"t":"01:50","who":"Agent","side":"agent","line":"Noted, I''ll flag the quantity-break option for Blackbird. Thanks Diane, talk soon."}
  ]'::jsonb,
  'Apr 17, 2026 - 10:14 AM'),

('v-01','RFQ-2026-0042','email','Mia - VendrSurf Agent','out','d.reyes@pmw-cnc.com',null,
  'RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics',
  'Hi Diane,

Great speaking just now. Here''s the RFQ packet as promised for the 500-unit CNC aluminum enclosure run.

Key specs (full details in attached drawing REV-C):
- Material: 6061-T6
- Finish: Type II clear anodize, bead-blast #180
- Qty: 500 units; quote quantity breaks at 500 / 750 / 1,000 welcome
- Tolerance: +/-0.05 mm on mating features, +/-0.1 mm general
- Certifications: ISO 9001 required; AS9100 a plus (confirmed you have it)
- Target unit price: $42 USD
- Required lead time: <= 35 days ARO

Please include NRE/tooling, MOQ if different from 500, and payment terms. If you want to propose tiered pricing to hit a lower unit at higher quantity, feel free.

Attached:
  - enclosure_v7.step
  - drawing_REV-C.pdf
  - BOM_with_fasteners.xlsx

Looking forward to your quote by Monday EOD.

Best,
Mia - VendrSurf Agent (on behalf of Blackbird Robotics)',
  array['enclosure_v7.step','drawing_REV-C.pdf','BOM_with_fasteners.xlsx'],
  null,null,null,'Apr 17, 2026 - 10:21 AM'),

('v-01','RFQ-2026-0042','email','Diane Reyes - Precision Machine Works','in',null,'d.reyes@pmw-cnc.com',
  'Re: RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics',
  'Mia,

Thanks for the packet - drawing is clean, STEP opened without issues. Quote below.

Qty 500:   $43.50 / unit
Qty 750:   $41.20 / unit
Qty 1,000: $39.80 / unit

NRE (fixturing + first-article): $1,850 one-time
Lead time: 28 days ARO for qty 500, 32 days for 750+
MOQ: 100 (we can run partial batches if useful)
Payment: Net 30 after first article acceptance
Anodize: in-house, included in unit price

AS9100 cert attached.

Happy to jump on a call with your engineering team if anything on the drawing needs clarification.

- Diane',
  array['PMW_AS9100_cert.pdf'],
  null,null,null,'Apr 18, 2026 - 2:47 PM'),

('v-01','RFQ-2026-0042','agent-note','Mia - VendrSurf Agent',null,null,null,null,
  'Quote received. Unit price at qty 750 ($41.20) beats your target ($42). Negotiating a 2-3% reduction on qty 500 before closing. NRE is ~30% below category median.',
  null,null,null,null,'Apr 18, 2026 - 2:49 PM'),

('v-01','RFQ-2026-0042','email','Mia - VendrSurf Agent','out','d.reyes@pmw-cnc.com',null,
  'Re: RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics',
  'Diane,

Thanks for the quick turnaround. The qty 750 pricing is compelling. A few things to close this out:

1. On qty 500 at $43.50 - can we get to $42 flat? Blackbird is firm on the 500 quantity for this build, but if the price lands we''d like to put PMW forward as the primary bid.
2. Confirm 28-day lead time is firm if PO lands by end of week.
3. Can payment terms move to 2% net 15?

If yes on 1+2, I''ll move PMW to the shortlist today.

Best,
Mia',
  null,null,null,null,'Apr 18, 2026 - 2:58 PM'),

('v-01','RFQ-2026-0042','email','Diane Reyes - Precision Machine Works','in',null,'d.reyes@pmw-cnc.com',
  'Re: RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics',
  'Mia,

1. We can do $42.00 flat at qty 500 if PO is in by Friday. Final offer - margin''s thin but the fit is good on our end.
2. 28 days confirmed if PO lands by Friday EOD.
3. 2% / net 15 is fine.

Shoot over the PO and we''ll slot it.

- Diane',
  null,null,null,null,'Apr 18, 2026 - 4:12 PM'),

('v-01','RFQ-2026-0042','agent-note','Mia - VendrSurf Agent',null,null,null,null,
  'Final: $41.20/unit (avg), 28 days, 2%/net 15, NRE $1,850. Matches target. Ready for handoff.',
  null,null,null,null,'Apr 18, 2026 - 4:15 PM')

on conflict do nothing;

