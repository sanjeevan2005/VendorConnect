/**
 * Centralized TypeScript interfaces for all domain models and API responses.
 *
 * These types eliminate `as Record<string, unknown>` casts and ensure
 * type safety across all frontend components.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Vendor
// ---------------------------------------------------------------------------

export type VendorStatus =
  | "discovered"
  | "calling"
  | "voicemail"
  | "responded"
  | "qualified"
  | "quoted"
  | "emailing"
  | "completed"
  | "no-response"
  | "declined";

export interface VendorContact {
  name?: string;
  role?: string;
  title?: string;
  linkedin?: string;
  phone?: string;
  email?: string;
  has_business_email?: boolean;
}

export interface Vendor {
  id: string;
  rfq_id?: string;
  name: string;
  location?: string;
  employees?: string;
  contact: VendorContact | null;
  status: VendorStatus;
  unit_price?: number | null;
  lead_time?: number | null;
  moq?: number | null;
  nre?: number | null;
  certs?: string[];
  capabilities?: string[];
  risk?: string;
  fit_score?: number;
  last_update?: string;
  call_duration?: string;
  call_outcome?: string;
  summary?: string;
  transcript?: string;
  recording_url?: string;
  email?: string;
  payment_terms?: string;
}

// ---------------------------------------------------------------------------
// RFQ
// ---------------------------------------------------------------------------

export interface RFQFile {
  name: string;
  size: string;
  kind: string;
}

export interface RFQ {
  id: string;
  title: string;
  summary?: string;
  status: string;
  created?: string;
  deadline?: string;
  quantity?: number;
  material?: string;
  finish?: string;
  tolerance?: string;
  certifications?: string[];
  geography?: string;
  target_unit?: number;
  targetUnit?: number;
  walk_away_unit?: number;
  walkAwayUnit?: number;
  max_lead_time_days?: number;
  maxLeadTimeDays?: number;
  tone?: string;
  files?: RFQFile[];
  // Form fields
  product_category?: string;
  product_description?: string;
  location?: string;
  budget_min?: number;
  budget_max?: number;
  timeline_weeks?: number;
  target_unit_price?: number;
  delivery_destination?: string;
  payment_terms?: string;
  sample_required?: boolean;
  recurring?: boolean;
  // Workspace
  workspace_name?: string;
  workspace_initials?: string;
  current_user_name?: string;
  current_user_email?: string;
  current_user_initials?: string;
}

export interface DashboardRFQ {
  id: string;
  title: string;
  qty: number;
  status: string;
  created: string;
  vendors: number;
  quotes: number;
  target: number | null;
  bestQuote: number | null;
}

// ---------------------------------------------------------------------------
// Thread Events (Activity Timeline)
// ---------------------------------------------------------------------------

export interface TranscriptLine {
  t: string;
  who: string;
  side: "agent" | "them";
  line: string;
}

export interface CallEvent {
  kind: "call";
  who: string;
  when: string;
  duration: string;
  outcome: string;
  transcript: TranscriptLine[];
}

export interface EmailEvent {
  kind: "email";
  direction: "in" | "out";
  who: string;
  to?: string;
  from?: string;
  when: string;
  subject: string;
  body: string;
  attachments?: string[];
}

export interface AgentNoteEvent {
  kind: "agent-note";
  who: string;
  when: string;
  body: string;
}

export type ThreadEvent = CallEvent | EmailEvent | AgentNoteEvent;

// ---------------------------------------------------------------------------
// Call Events (from Vapi webhooks, stored in call_events table)
// ---------------------------------------------------------------------------

export interface CallEventPayload {
  event: string;
  call_id?: string;
  rfq_id?: string;
  vendor_id?: string;
  status?: string;
  transcript?: string;
  recording_url?: string;
  summary?: string;
  outcome?: string;
  duration_seconds?: number;
  vendor_ballpark_unit_price_low?: number;
  vendor_ballpark_unit_price_high?: number;
  vendor_lead_time_production_weeks?: number;
  vendor_moq?: number;
  messages?: Array<{ role: string; message: string }>;
  [key: string]: unknown;
}

export interface CallEventRow {
  id: number;
  call_id?: string;
  rfq_id?: string;
  vendor_id?: string;
  event_type: string;
  status?: string;
  payload: CallEventPayload;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API Responses
// ---------------------------------------------------------------------------

export interface DiscoverVendorsResponse {
  vendors: Vendor[];
  search_plan: {
    categories: string[];
    specialities: string[];
    title_keywords: string[];
    headcount_range?: number[] | null;
  };
  auto_call_error?: string | null;
}

export interface CallResponse {
  call_id: string;
  status: string;
  message: string;
}

// ---------------------------------------------------------------------------
// View State
// ---------------------------------------------------------------------------

export type ViewName = "dashboard" | "rfq-new" | "rfq" | "vendor";

export interface ViewState {
  view: ViewName;
  rfqId?: string;
  vendorId?: string;
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const VendorContactSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  title: z.string().optional(),
  linkedin: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  has_business_email: z.boolean().optional(),
});

export const VendorSchema = z.object({
  id: z.string(),
  rfq_id: z.string().optional(),
  name: z.string(),
  location: z.string().optional().nullable(),
  employees: z.string().optional().nullable(),
  contact: VendorContactSchema.nullable(),
  status: z.string(),
  unit_price: z.number().optional().nullable(),
  lead_time: z.number().optional().nullable(),
  moq: z.number().optional().nullable(),
  nre: z.number().optional().nullable(),
  certs: z.array(z.string()).optional().nullable(),
  capabilities: z.array(z.string()).optional().nullable(),
  risk: z.string().optional().nullable(),
  fit_score: z.number().optional().nullable(),
  last_update: z.string().optional().nullable(),
  call_duration: z.string().optional().nullable(),
  call_outcome: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  transcript: z.string().optional().nullable(),
  recording_url: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  payment_terms: z.string().optional().nullable(),
});

export const DashboardRFQSchema = z.object({
  id: z.string(),
  title: z.string(),
  qty: z.number(),
  status: z.string(),
  created: z.string(),
  vendors: z.number(),
  quotes: z.number(),
  target: z.number().nullable(),
  bestQuote: z.number().nullable(),
});
