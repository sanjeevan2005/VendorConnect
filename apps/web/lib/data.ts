export const CURRENT_USER = { name: "Sam Patel", email: "sam@blackbird-robotics.com", initials: "SP" };
export const WORKSPACE = { name: "Blackbird Robotics", initials: "BR" };

export const RFQ_DATA = {
  id: "RFQ-2026-0042",
  title: "CNC-machined aluminum enclosures",
  summary: "500 units - 6061-T6 - anodized - IP65-rated",
  status: "active",
  created: "Apr 17, 2026",
  deadline: "May 22, 2026",
  quantity: 500,
  material: "Aluminum 6061-T6",
  finish: "Type II clear anodize, bead-blast #180",
  tolerance: "+/-0.05 mm on mating features, +/-0.1 mm general",
  certifications: ["ISO 9001", "RoHS"],
  geography: "North America preferred; Asia acceptable for qty >500",
  targetUnit: 42,
  walkAwayUnit: 58,
  maxLeadTimeDays: 35,
  tone: "balanced",
  files: [
    { name: "enclosure_v7.step", size: "2.4 MB", kind: "STEP" },
    { name: "drawing_REV-C.pdf", size: "412 KB", kind: "PDF" },
    { name: "BOM_with_fasteners.xlsx", size: "38 KB", kind: "XLS" },
    { name: "reference_assembly.jpg", size: "1.1 MB", kind: "IMG" },
  ],
};

import { Vendor, VendorStatus } from "./types";

export const VENDORS: Vendor[] = [
  {
    id: "v-01", name: "Precision Machine Works", location: "Torrance, CA", employees: "45-60",
    contact: { name: "Diane Reyes", role: "VP Sales", linkedin: "in/dianereyes-pmw", phone: "(310) 555-0134", email: "d.reyes@pmw-cnc.com" },
    status: "quoted", unit_price: 41.20, lead_time: 28, moq: 100, nre: 1850,
    certs: ["ISO 9001", "ITAR", "AS9100"], capabilities: ["5-axis CNC", "Anodizing in-house", "First-article inspection"],
    risk: "low", fit_score: 94, last_update: "2m ago", call_duration: "4:18", call_outcome: "Qualified",
    summary: "Strong fit. In-house anodizing, AS9100, has capacity in their 5-axis cell.",
  },
  {
    id: "v-02", name: "Sierra Custom Metals", location: "Reno, NV", employees: "80-100",
    contact: { name: "Marcus Yun", role: "BD Lead", linkedin: "in/marcusyun", phone: "(775) 555-0188", email: "m.yun@sierracustom.com" },
    status: "quoted", unit_price: 38.90, lead_time: 35, moq: 250, nre: 2400,
    certs: ["ISO 9001"], capabilities: ["3-axis + 5-axis", "Outsourced anodize"],
    risk: "low", fit_score: 88, last_update: "7m ago", call_duration: "3:42", call_outcome: "Qualified",
    summary: "Lowest quote. Anodizing outsourced - adds 4 days to lead time.",
  },
  {
    id: "v-03", name: "Foshan Precision MFG", location: "Foshan, CN", employees: "200+",
    contact: { name: "Wei Chen", role: "Account Manager", linkedin: "in/weichen-fpm", phone: "+86 757 8812 4410", email: "w.chen@foshan-precision.cn" },
    status: "quoted", unit_price: 26.40, lead_time: 42, moq: 500, nre: 900,
    certs: ["ISO 9001", "IATF 16949"], capabilities: ["5-axis CNC", "Full anodizing line", "Export to NA"],
    risk: "medium", fit_score: 81, last_update: "14m ago", call_duration: "5:51", call_outcome: "Qualified",
    summary: "Cheapest unit price. Geography flagged per guardrail (NA preferred).",
  },
  {
    id: "v-04", name: "Cascade Tooling Co.", location: "Portland, OR", employees: "20-30",
    contact: { name: "Alex Tran", role: "Owner / Sales", linkedin: "in/alextran-cascade", phone: "(503) 555-0162", email: "alex@cascadetooling.com" },
    status: "emailing", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001"], capabilities: ["5-axis CNC", "Anodize partner"],
    risk: "low", fit_score: 79, last_update: "just now", call_duration: "3:08", call_outcome: "Qualified - awaiting formal quote",
    summary: "Qualified on call. Formal quote requested via email; agent is negotiating MOQ.",
  },
  {
    id: "v-05", name: "Summit CNC", location: "Denver, CO", employees: "15-20",
    contact: { name: "Priya Desai", role: "Sales Manager", linkedin: "in/priyadesai-summit", phone: "(720) 555-0199", email: "p.desai@summitcnc.com" },
    status: "calling", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001"], capabilities: ["3-axis CNC", "Small-batch specialist"],
    risk: "unknown", fit_score: 72, last_update: "live", call_duration: "0:47", call_outcome: "In progress",
    summary: "Call in progress - discussing capacity for 500-unit run.",
  },
  {
    id: "v-06", name: "Northgate Fabrication", location: "Hamilton, ON", employees: "60-80",
    contact: { name: "Owen Walsh", role: "Director of Sales", linkedin: "in/owenwalsh", phone: "(905) 555-0143", email: "o.walsh@northgatefab.ca" },
    status: "voicemail", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001", "ITAR"], capabilities: ["5-axis CNC", "Type III anodize"],
    risk: "unknown", fit_score: 85, last_update: "21m ago", call_duration: "0:32", call_outcome: "Voicemail left",
    summary: "No pickup. Voicemail left with callback info; followup email queued.",
  },
  {
    id: "v-07", name: "Ironwood Machining", location: "Austin, TX", employees: "30-40",
    contact: { name: "Jenna Kowalski", role: "VP Operations", linkedin: "in/jennakowalski", phone: "(512) 555-0176", email: "j.kowalski@ironwoodmfg.com" },
    status: "declined", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: [], capabilities: ["3-axis CNC"],
    risk: "-", fit_score: 64, last_update: "32m ago", call_duration: "1:54", call_outcome: "No capacity this quarter",
    summary: "Booked through Q3. Passed - follow up in August.",
  },
  {
    id: "v-08", name: "Midwest Precision", location: "Cleveland, OH", employees: "50-70",
    contact: { name: "Tom Beckett", role: "Sales Director", linkedin: "in/tombeckett-mwp", phone: "(216) 555-0155", email: "t.beckett@midwest-precision.com" },
    status: "declined", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001"], capabilities: ["5-axis CNC"],
    risk: "-", fit_score: 77, last_update: "44m ago", call_duration: "2:12", call_outcome: "Not a fit - no anodize partner",
    summary: "Declined. Would need us to handle finishing separately; violates spec.",
  },
  {
    id: "v-09", name: "Kinetic Metalworks", location: "San Diego, CA", employees: "25-35",
    contact: { name: "Rita Oduya", role: "Sales Lead", linkedin: "in/ritaoduya", phone: "(619) 555-0109", email: "r.oduya@kinetic-metal.com" },
    status: "calling", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001"], capabilities: ["5-axis CNC", "Light anodize"],
    risk: "unknown", fit_score: 83, last_update: "live", call_duration: "1:23", call_outcome: "In progress",
    summary: "Call in progress - confirming tolerance capability on thin walls.",
  },
  {
    id: "v-10", name: "Dongguan Sunrise Metals", location: "Dongguan, CN", employees: "150+",
    contact: { name: "Lily Wang", role: "Export Sales", linkedin: "in/lilywang-sunrise", phone: "+86 769 2280 1188", email: "l.wang@sunrisemetal.cn" },
    status: "emailing", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001", "IATF 16949"], capabilities: ["5-axis CNC", "In-house anodize"],
    risk: "medium", fit_score: 78, last_update: "5m ago", call_duration: "4:05", call_outcome: "Qualified - quote pending",
    summary: "Asked for 3D file; agent sent STEP + drawing. Awaiting quote.",
  },
  {
    id: "v-11", name: "Rockford CNC", location: "Rockford, IL", employees: "40-50",
    contact: { name: "Brandon Hale", role: "VP Sales", linkedin: "in/brandonhale-rockford", phone: "(815) 555-0181", email: "b.hale@rockfordcnc.com" },
    status: "voicemail", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001"], capabilities: ["3-axis + 5-axis", "Anodize partner"],
    risk: "unknown", fit_score: 76, last_update: "17m ago", call_duration: "0:28", call_outcome: "Voicemail - no callback window",
    summary: "Left voicemail. Second attempt scheduled for tomorrow 10am.",
  },
  {
    id: "v-12", name: "BluePeak Manufacturing", location: "Boise, ID", employees: "20-30",
    contact: { name: "Karl Nguyen", role: "Owner", linkedin: "in/karlnguyen", phone: "(208) 555-0170", email: "karl@bluepeakmfg.com" },
    status: "qualified", unit_price: null, lead_time: null, moq: null, nre: null,
    certs: ["ISO 9001"], capabilities: ["5-axis CNC", "Specialty anodize"],
    risk: "low", fit_score: 86, last_update: "1m ago", call_duration: "6:02", call_outcome: "Qualified",
    summary: "Strong fit. Owner-operated; quote expected within 24h.",
  },
];

export const THREAD_EVENTS = [
  {
    kind: "call" as const,
    who: "agent",
    when: "Apr 17, 2026 - 10:14 AM",
    duration: "4:18",
    outcome: "Qualified",
    transcript: [
      { t: "00:00", who: "Agent", side: "agent", line: "Hi, this is Mia from VendrSurf calling on behalf of Blackbird Robotics. Is Diane available?" },
      { t: "00:04", who: "Diane", side: "them", line: "This is Diane, what can I do for you?" },
      { t: "00:07", who: "Agent", side: "agent", line: "Blackbird is sourcing a run of 500 CNC-machined aluminum enclosures - 6061-T6, Type II clear anodize, IP65-rated. Is that something Precision could quote?" },
      { t: "00:18", who: "Diane", side: "them", line: "500 units, anodize in-house? Yeah, that's right in our wheelhouse. What's the complexity - single-piece or multi-part assembly?" },
      { t: "00:26", who: "Agent", side: "agent", line: "Single piece, approx 140 x 90 x 55 millimeters, 14 features including press-fit inserts. Wall thickness 2.5 to 4 millimeters. I can send the STEP and drawing after this call." },
      { t: "00:42", who: "Diane", side: "them", line: "Got it. Ballpark - on 500 units at that size with Type II clear, we're probably looking at the low forties unit, maybe high thirties if we batch the anodize. Lead time four-ish weeks after PO." },
      { t: "00:58", who: "Agent", side: "agent", line: "That works against our target. Tolerance on mating features is +/-0.05 millimeters - any issue holding that on your 5-axis?" },
      { t: "01:10", who: "Diane", side: "them", line: "No problem. We hold tenths on that class all day." },
      { t: "01:14", who: "Agent", side: "agent", line: "Great. Are you AS9100 certified? We saw it listed but want to confirm it's current." },
      { t: "01:22", who: "Diane", side: "them", line: "Yes, renewed in February. I'll include the cert in the quote packet." },
      { t: "01:28", who: "Agent", side: "agent", line: "Perfect. I'll email the full RFQ packet - STEP, drawing revision C, BOM, spec sheet - within the next few minutes. Can we get a formal quote back by Monday?" },
      { t: "01:40", who: "Diane", side: "them", line: "Monday EOD works. Anything over 500 and we can usually bring the unit price down a couple dollars - mention that if they're flexible." },
      { t: "01:50", who: "Agent", side: "agent", line: "Noted, I'll flag the quantity-break option for Blackbird. Thanks Diane, talk soon." },
    ],
  },
  {
    kind: "email" as const,
    direction: "out" as const,
    who: "Mia - VendrSurf Agent",
    to: "d.reyes@pmw-cnc.com",
    when: "Apr 17, 2026 - 10:21 AM",
    subject: "RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics",
    body: `Hi Diane,

Great speaking just now. Here's the RFQ packet as promised for the 500-unit CNC aluminum enclosure run.

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
Mia - VendrSurf Agent (on behalf of Blackbird Robotics)`,
    attachments: ["enclosure_v7.step", "drawing_REV-C.pdf", "BOM_with_fasteners.xlsx"],
  },
  {
    kind: "email" as const,
    direction: "in" as const,
    who: "Diane Reyes - Precision Machine Works",
    from: "d.reyes@pmw-cnc.com",
    when: "Apr 18, 2026 - 2:47 PM",
    subject: "Re: RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics",
    body: `Mia,

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

- Diane`,
    attachments: ["PMW_AS9100_cert.pdf"],
  },
  {
    kind: "agent-note" as const,
    who: "Mia - VendrSurf Agent",
    when: "Apr 18, 2026 - 2:49 PM",
    body: "Quote received. Unit price at qty 750 ($41.20) beats your target ($42). Negotiating a 2-3% reduction on qty 500 before closing. NRE is ~30% below category median.",
  },
  {
    kind: "email" as const,
    direction: "out" as const,
    who: "Mia - VendrSurf Agent",
    to: "d.reyes@pmw-cnc.com",
    when: "Apr 18, 2026 - 2:58 PM",
    subject: "Re: RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics",
    body: `Diane,

Thanks for the quick turnaround. The qty 750 pricing is compelling. A few things to close this out:

1. On qty 500 at $43.50 - can we get to $42 flat? Blackbird is firm on the 500 quantity for this build, but if the price lands we'd like to put PMW forward as the primary bid.
2. Confirm 28-day lead time is firm if PO lands by end of week.
3. Can payment terms move to 2% net 15?

If yes on 1+2, I'll move PMW to the shortlist today.

Best,
Mia`,
  },
  {
    kind: "email" as const,
    direction: "in" as const,
    who: "Diane Reyes - Precision Machine Works",
    from: "d.reyes@pmw-cnc.com",
    when: "Apr 18, 2026 - 4:12 PM",
    subject: "Re: RFQ: 500 units CNC aluminum enclosures - Blackbird Robotics",
    body: `Mia,

1. We can do $42.00 flat at qty 500 if PO is in by Friday. Final offer - margin's thin but the fit is good on our end.
2. 28 days confirmed if PO lands by Friday EOD.
3. 2% / net 15 is fine.

Shoot over the PO and we'll slot it.

- Diane`,
  },
  {
    kind: "agent-note" as const,
    who: "Mia - VendrSurf Agent",
    when: "Apr 18, 2026 - 4:15 PM",
    body: "Final: $41.20/unit (avg), 28 days, 2%/net 15, NRE $1,850. Matches target. Ready for handoff.",
  },
];

export const DASHBOARD_RFQS = [
  { id: "RFQ-2026-0042", title: "CNC-machined aluminum enclosures", qty: 500, status: "active", created: "Apr 17", vendors: 12, quotes: 3, target: 42, bestQuote: 38.90 },
  { id: "RFQ-2026-0039", title: "Trade show booth build - 20x20", qty: 1, status: "active", created: "Apr 14", vendors: 8, quotes: 5, target: null, bestQuote: null },
  { id: "RFQ-2026-0038", title: "Sensor dev boards - eval hardware", qty: 50, status: "closed", created: "Apr 09", vendors: 6, quotes: 6, target: 180, bestQuote: 164 },
  { id: "RFQ-2026-0033", title: "Injection-molded bezel, ABS", qty: 2000, status: "closed", created: "Mar 28", vendors: 15, quotes: 9, target: 3.40, bestQuote: 3.12 },
  { id: "RFQ-2026-0031", title: "EMC/FCC certification testing", qty: 1, status: "active", created: "Mar 25", vendors: 5, quotes: 2, target: null, bestQuote: null },
  { id: "RFQ-2026-0028", title: "Office buildout - 4,200 sqft", qty: 1, status: "closed", created: "Mar 12", vendors: 11, quotes: 7, target: null, bestQuote: null },
];

