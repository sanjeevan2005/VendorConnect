"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const UOM_OPTIONS = ["units", "kg", "tons", "meters", "liters", "pieces"] as const;
const PAYMENT_OPTIONS = ["", "advance", "net_30", "net_60", "net_90"] as const;

type Uom = (typeof UOM_OPTIONS)[number];
type PaymentTerms = (typeof PAYMENT_OPTIONS)[number];

type Fields = {
  location: string;
  product_category: string;
  product_description: string;
  quantity: number | "";
  unit_of_measure: Uom;
  budget_min: number | "";
  budget_max: number | "";
  target_unit_price: number | "";
  timeline_weeks: number | "";
  delivery_destination: string;
  certifications: string;
  payment_terms: PaymentTerms;
  sample_required: boolean;
  recurring: boolean;
};

const EMPTY: Fields = {
  location: "",
  product_category: "",
  product_description: "",
  quantity: "",
  unit_of_measure: "units",
  budget_min: "",
  budget_max: "",
  target_unit_price: "",
  timeline_weeks: "",
  delivery_destination: "",
  certifications: "",
  payment_terms: "",
  sample_required: false,
  recurring: false,
};

function genRfqId() {
  const yr = new Date().getFullYear();
  const suffix = crypto.randomUUID().slice(0, 8);
  return `RFQ-${yr}-${suffix}`;
}

function splitCerts(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export function RfqNew({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = (): boolean => {
    const e: Partial<Record<keyof Fields, string>> = {};
    if (!/^[A-Z]{3}$/.test(fields.location.trim())) e.location = "ISO3 country code (e.g. USA)";
    if (!fields.product_category.trim()) e.product_category = "Required";
    if (!fields.product_description.trim()) e.product_description = "Required";
    if (fields.quantity === "" || Number(fields.quantity) <= 0) e.quantity = "Must be > 0";
    if (fields.budget_min === "" || Number(fields.budget_min) < 0) e.budget_min = "Required";
    if (fields.budget_max === "" || Number(fields.budget_max) <= 0) e.budget_max = "Required";
    if (fields.budget_min !== "" && fields.budget_max !== "" && Number(fields.budget_min) > Number(fields.budget_max))
      e.budget_max = "Max must be >= min";
    if (fields.target_unit_price !== "" && Number(fields.target_unit_price) < 0) e.target_unit_price = "Must be >= 0";
    if (fields.timeline_weeks === "" || Number(fields.timeline_weeks) <= 0) e.timeline_weeks = "Must be > 0";
    if (!fields.delivery_destination.trim()) e.delivery_destination = "Required (city, country)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitting(true);
    setSubmitError(null);

    const id = genRfqId();
    const row = {
      id,
      title: fields.product_category,
      status: "active",
      quantity: Number(fields.quantity),
      location: fields.location.toUpperCase(),
      product_category: fields.product_category,
      product_description: fields.product_description,
      unit_of_measure: fields.unit_of_measure,
      budget_min: Number(fields.budget_min),
      budget_max: Number(fields.budget_max),
      target_unit_price: fields.target_unit_price === "" ? null : Number(fields.target_unit_price),
      timeline_weeks: Number(fields.timeline_weeks),
      delivery_destination: fields.delivery_destination,
      certifications: splitCerts(fields.certifications),
      payment_terms: fields.payment_terms === "" ? null : fields.payment_terms,
      sample_required: fields.sample_required,
      recurring: fields.recurring,
    };
    try {
      const dbRes = await fetch(`${API_URL}/api/rfqs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!dbRes.ok) {
        setSubmitting(false);
        setSubmitError(`Could not save RFQ: HTTP ${dbRes.status}`);
        return;
      }
    } catch (err) {
      setSubmitting(false);
      setSubmitError(`Could not save RFQ: ${err instanceof Error ? err.message : "network error"}`);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/discover-vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfq_id: id,
          location: row.location,
          product_category: row.product_category,
          quantity: row.quantity,
          budget_min: row.budget_min,
          budget_max: row.budget_max,
          timeline_weeks: row.timeline_weeks,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setSubmitting(false);
        setSubmitError(`RFQ saved, but vendor discovery failed: ${body?.detail ?? `HTTP ${res.status}`}. Try again from the RFQ detail page.`);
        return;
      }
      if (body?.error) {
        setSubmitting(false);
        setSubmitError(`RFQ saved, but vendor discovery failed: ${body.message ?? body.error}.`);
        return;
      }
    } catch (err) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "network error";
      setSubmitError(`RFQ saved, but could not reach discovery service: ${msg}`);
      return;
    }
    onCreated(id);
  };

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setFields((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const numVal = (v: number | "") => (v === "" ? "" : String(v));
  const parseNum = (s: string): number | "" => (s === "" ? "" : Number(s));

  return (
    <div className="content fade-in" style={{ maxWidth: 860 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginLeft: -8 }}>
          <Icons.Chev size={12} style={{ transform: "rotate(180deg)" }} /> Dashboard
        </button>
      </div>

      <h1 className="h1">New RFQ</h1>
      <div className="muted" style={{ marginTop: 4, fontSize: 13.5, marginBottom: 20 }}>
        Fill in the sourcing details. Starred fields are required; the rest give the voice agent more to negotiate with.
      </div>

      <div className="card card-pad">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Product / category *" error={errors.product_category} full>
            <input
              className="input"
              value={fields.product_category}
              onChange={(e) => set("product_category", e.target.value)}
              placeholder="CNC-machined aluminum enclosures"
            />
          </Field>

          <Field label="Product description *" error={errors.product_description} full>
            <textarea
              className="input"
              rows={3}
              value={fields.product_description}
              onChange={(e) => set("product_description", e.target.value)}
              placeholder="6061-T6 aluminum, 120x80x25mm, +/-0.05mm tolerance, anodized black, threaded inserts on 4 corners"
              style={{ resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>

          <Field label="Location (ISO3) *" error={errors.location}>
            <input
              className="input mono"
              value={fields.location}
              maxLength={3}
              onChange={(e) => set("location", e.target.value.toUpperCase())}
              placeholder="USA"
            />
          </Field>
          <Field label="Delivery destination *" error={errors.delivery_destination}>
            <input
              className="input"
              value={fields.delivery_destination}
              onChange={(e) => set("delivery_destination", e.target.value)}
              placeholder="Austin, USA"
            />
          </Field>

          <Field label="Quantity *" error={errors.quantity}>
            <input
              className="input"
              type="number"
              min={1}
              value={numVal(fields.quantity)}
              onChange={(e) => set("quantity", parseNum(e.target.value))}
              placeholder="500"
            />
          </Field>
          <Field label="Unit of measure *">
            <select
              className="input"
              value={fields.unit_of_measure}
              onChange={(e) => set("unit_of_measure", e.target.value as Uom)}
            >
              {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>

          <Field label="Budget min (USD/unit) *" error={errors.budget_min}>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={numVal(fields.budget_min)}
              onChange={(e) => set("budget_min", parseNum(e.target.value))}
              placeholder="35"
            />
          </Field>
          <Field label="Budget max (USD/unit) *" error={errors.budget_max}>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={numVal(fields.budget_max)}
              onChange={(e) => set("budget_max", parseNum(e.target.value))}
              placeholder="58"
            />
          </Field>

          <Field label="Target unit price (USD)" error={errors.target_unit_price}>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={numVal(fields.target_unit_price)}
              onChange={(e) => set("target_unit_price", parseNum(e.target.value))}
              placeholder="42"
            />
          </Field>
          <Field label="Timeline (weeks) *" error={errors.timeline_weeks}>
            <input
              className="input"
              type="number"
              min={1}
              value={numVal(fields.timeline_weeks)}
              onChange={(e) => set("timeline_weeks", parseNum(e.target.value))}
              placeholder="6"
            />
          </Field>

          <Field label="Certifications (comma-separated)" full>
            <input
              className="input"
              value={fields.certifications}
              onChange={(e) => set("certifications", e.target.value)}
              placeholder="RoHS, ISO 9001, REACH"
            />
          </Field>

          <Field label="Payment terms">
            <select
              className="input"
              value={fields.payment_terms}
              onChange={(e) => set("payment_terms", e.target.value as PaymentTerms)}
            >
              <option value="">-</option>
              {PAYMENT_OPTIONS.filter(Boolean).map((p) => (
                <option key={p} value={p}>{p.replace("_", " ")}</option>
              ))}
            </select>
          </Field>
          <Field label="Other">
            <div className="row" style={{ gap: 16, paddingTop: 8 }}>
              <label className="row" style={{ gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={fields.sample_required}
                  onChange={(e) => set("sample_required", e.target.checked)}
                />
                Sample required
              </label>
              <label className="row" style={{ gap: 6, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={fields.recurring}
                  onChange={(e) => set("recurring", e.target.checked)}
                />
                Recurring order
              </label>
            </div>
          </Field>
        </div>

        <div className="row" style={{ marginTop: 20, justifyContent: "flex-end", gap: 8 }}>
          {submitError && <div className="tiny" style={{ color: "var(--warn)", marginRight: "auto" }}>{submitError}</div>}
          <button className="btn" onClick={onBack} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={submitting}>
            {submitting ? "Creating..." : "Create RFQ & start outreach"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, children, error, full,
}: { label: string; children: React.ReactNode; error?: string; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label className="tiny" style={{ display: "block", marginBottom: 6, color: "var(--text-secondary)", fontWeight: 600 }}>
        {label}
      </label>
      {children}
      {error && <div className="tiny" style={{ marginTop: 4, color: "var(--warn)" }}>{error}</div>}
    </div>
  );
}

