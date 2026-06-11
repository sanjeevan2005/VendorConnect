"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { RFQ_DATA, VENDORS, Vendor } from "@/lib/data";
import { Sidebar, Topbar, FitBar } from "@/components/shell";
import { StatusChip } from "@/components/status-chip";
import { Icons } from "@/components/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type RfqRow = {
  id: string;
  title: string | null;
  product_category: string | null;
  product_description: string | null;
  quantity: number | null;
  unit_of_measure: string | null;
  target_unit_price: number | null;
  budget_min: number | null;
  budget_max: number | null;
  timeline_weeks: number | null;
  delivery_destination: string | null;
  location: string | null;
  certifications: string[] | null;
  created_at: string | null;
};

function mapVendor(v: Record<string, unknown>): Vendor {
  const rawContact = (v.contact as Record<string, unknown> | null) ?? null;
  const contact = rawContact
    ? {
        name: (rawContact.name as string) ?? "-",
        role: (rawContact.role as string) ?? (rawContact.title as string) ?? "",
        linkedin: rawContact.linkedin as string | undefined,
        phone: rawContact.phone as string | undefined,
        email: rawContact.email as string | undefined,
      }
    : { name: "-", role: "" };
  return {
    id: v.id as string,
    name: (v.name as string) ?? "Unknown",
    location: (v.location as string) ?? "-",
    employees: (v.employees as string) ?? "-",
    contact,
    status: ((v.status as Vendor["status"]) ?? "discovered"),
    unitPrice: (v.unit_price as number | null) ?? null,
    leadTime: (v.lead_time as number | null) ?? null,
    moq: (v.moq as number | null) ?? null,
    nre: (v.nre as number | null) ?? null,
    certs: (v.certs as string[]) ?? [],
    capabilities: (v.capabilities as string[]) ?? [],
    risk: (v.risk as string) ?? "-",
    fitScore: (v.fit_score as number) ?? 0,
    lastUpdate: (v.last_update as string) ?? "just now",
    callDuration: (v.call_duration as string) ?? "0:00",
    callOutcome: (v.call_outcome as string) ?? "Awaiting outreach",
    summary: (v.summary as string) ?? "",
  };
}

export function RfqDetail({ rfqId, onBack, onOpenVendor }: { rfqId: string; onBack: () => void; onOpenVendor: (id: string) => void }) {
  const [rfqRow, setRfqRow] = useState<RfqRow | null>(null);
  const [filter, setFilter] = useState("all");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const isFixture = rfqId === RFQ_DATA.id;

  useEffect(() => {
    if (!supabase) return;

    supabase.from("rfqs").select("*").eq("id", rfqId).maybeSingle().then(({ data }) => {
      if (data) setRfqRow(data as RfqRow);
    });
  }, [rfqId]);

  useEffect(() => {
    let cancelled = false;
    const fetchVendors = async () => {
      if (!supabase) {
        setVendors(isFixture ? VENDORS : []);
        setLoading(false);
        return;
      }

      const { data } = await supabase.from("vendors").select("*").eq("rfq_id", rfqId);
      if (cancelled) return;
      if (data && data.length > 0) {
        setVendors(data.map(mapVendor));
      } else if (isFixture) {
        setVendors(VENDORS);
      } else {
        setVendors([]);
      }
      setLoading(false);
    };
    fetchVendors();
    const poll = setInterval(fetchVendors, 5000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [rfqId, isFixture]);

  const rfq = rfqRow
    ? {
        id: rfqRow.id,
        title: rfqRow.title ?? rfqRow.product_category ?? "Untitled RFQ",
        summary: [
          rfqRow.quantity != null ? `${rfqRow.quantity} ${rfqRow.unit_of_measure ?? "units"}` : null,
          rfqRow.product_description,
          rfqRow.delivery_destination,
        ].filter(Boolean).join(" - "),
        created: rfqRow.created_at ? new Date(rfqRow.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-",
        targetUnit: rfqRow.target_unit_price ?? 0,
        walkAwayUnit: rfqRow.budget_max ?? 0,
      }
    : RFQ_DATA;

  // Live tick for calling vendors
  useEffect(() => {
    const t = setInterval(() => {
      setVendors((vs) =>
        vs.map((v) => {
          if (v.status === "calling") {
            const [m, s] = v.callDuration.split(":").map(Number);
            const total = m * 60 + s + 1;
            return { ...v, callDuration: `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}` };
          }
          return v;
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const counts = {
    all: vendors.length,
    discovered: vendors.filter((v) => v.status === "discovered").length,
    calling: vendors.filter((v) => v.status === "calling").length,
    qualified: vendors.filter((v) => ["qualified", "emailing"].includes(v.status)).length,
    quoted: vendors.filter((v) => v.status === "quoted").length,
    voicemail: vendors.filter((v) => v.status === "voicemail").length,
    declined: vendors.filter((v) => v.status === "declined").length,
  };

  const [callingId, setCallingId] = useState<string | null>(null);
  const [callMsg, setCallMsg] = useState<Record<string, string>>({});
  const triggerCall = async (vendorId: string) => {
    setCallingId(vendorId);
    setCallMsg((m) => ({ ...m, [vendorId]: "" }));
    try {
      const r = await fetch(`${API_URL}/api/call-vendor`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rfq_id: rfqId, vendor_id: vendorId }),
      });
      const j = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }));
      if (!r.ok) throw new Error(j?.detail ?? j?.message ?? `HTTP ${r.status}`);
      setCallMsg((m) => ({ ...m, [vendorId]: "triggered" }));
    } catch (e) {
      setCallMsg((m) => ({ ...m, [vendorId]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setCallingId(null);
    }
  };

  const filtered = vendors.filter((v) => {
    if (filter === "all") return true;
    if (filter === "qualified") return ["qualified", "emailing"].includes(v.status);
    return v.status === filter;
  });

  return (
    <div className="content fade-in" style={{ maxWidth: 1280 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginLeft: -8 }}>
          <Icons.Chev size={12} style={{ transform: "rotate(180deg)" }} /> Dashboard
        </button>
      </div>

      <div className="row" style={{ marginBottom: 4, alignItems: "flex-start" }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <span className="tiny mono" style={{ color: "var(--text-tertiary)" }}>{rfq.id}</span>
            <StatusChip status="active" />
          </div>
          <h1 className="h1">{rfq.title}</h1>
          <div className="muted" style={{ marginTop: 4, fontSize: 13.5 }}>
            {rfq.summary} - launched {rfq.created}
            {rfq.targetUnit ? ` - target $${rfq.targetUnit}/unit` : ""}
            {rfq.walkAwayUnit ? ` - walk-away $${rfq.walkAwayUnit}` : ""}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn"><Icons.Download size={13} /> Export</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginTop: 20, marginBottom: 20 }}>
        <div className="card stat"><div className="stat-label">Reached out</div><div className="stat-value">{counts.all}</div></div>
        <div className="card stat">
          <div className="stat-label">Live calls</div>
          <div className="stat-value" style={{ color: "var(--warn)", display: "flex", alignItems: "center", gap: 8 }}>
            {counts.calling}{counts.calling > 0 && <span className="pulse-dot" />}
          </div>
        </div>
        <div className="card stat"><div className="stat-label">Qualified</div><div className="stat-value" style={{ color: "var(--info)" }}>{counts.qualified}</div></div>
        <div className="card stat"><div className="stat-label">Quoted</div><div className="stat-value" style={{ color: "var(--pos)" }}>{counts.quoted}</div></div>
        <div className="card stat"><div className="stat-label">Declined</div><div className="stat-value" style={{ color: "var(--text-tertiary)" }}>{counts.declined}</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(90deg, var(--accent-soft), transparent)" }}>
          <div className="pulse-dot" style={{ background: "var(--accent)" }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Agent is live</div>
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            {counts.calling} calls active - {vendors.filter((v) => v.status === "emailing").length} email threads open - last action just now
          </div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="segmented">
          {(
            [
              ["all", `All - ${counts.all}`],
              ["discovered", `Discovered - ${counts.discovered}`],
              ["calling", `Calling - ${counts.calling}`],
              ["qualified", `Qualified - ${counts.qualified}`],
              ["quoted", `Quoted - ${counts.quoted}`],
              ["voicemail", `Voicemail - ${counts.voicemail}`],
              ["declined", `Declined - ${counts.declined}`],
            ] as [string, string][]
          ).map(([v, l]) => (
            <button key={v} className={filter === v ? "active" : ""} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>Loading vendors...</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Vendor</th>
                <th style={{ width: 140 }}>Contact</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 110, textAlign: "right" }}>Unit price</th>
                <th style={{ width: 90, textAlign: "right" }}>Lead</th>
                <th style={{ minWidth: 240 }}>Last action</th>
                <th style={{ width: 110 }}></th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="clickable" onClick={() => onOpenVendor(v.id)}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{v.name}</div>
                    <div className="tiny" style={{ marginTop: 2, color: "var(--text-secondary)" }}>{v.location} - {v.employees}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.contact.name}</div>
                    <div className="tiny" style={{ marginTop: 2 }}>{v.contact.role}</div>
                  </td>
                  <td><StatusChip status={v.status} /></td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {v.unitPrice != null ? (
                      <div>
                        <div style={{ fontWeight: 600, color: v.unitPrice <= rfq.targetUnit ? "var(--pos)" : "var(--text)" }}>
                          ${v.unitPrice.toFixed(2)}
                        </div>
                        <div className="tiny" style={{ color: v.unitPrice <= rfq.targetUnit ? "var(--pos)" : "var(--text-tertiary)" }}>
                          {v.unitPrice <= rfq.targetUnit
                            ? `-$${(rfq.targetUnit - v.unitPrice).toFixed(2)}`
                            : `+$${(v.unitPrice - rfq.targetUnit).toFixed(2)}`}
                        </div>
                      </div>
                    ) : <span style={{ color: "var(--text-tertiary)" }}>-</span>}
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                    {v.leadTime != null ? `${v.leadTime}d` : "-"}
                  </td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      {v.status === "calling" && <Icons.Phone size={13} style={{ color: "var(--warn)" }} />}
                      {["quoted", "emailing"].includes(v.status) && <Icons.Mail size={13} style={{ color: "var(--info)" }} />}
                      {v.status === "voicemail" && <Icons.Mic size={13} style={{ color: "var(--text-tertiary)" }} />}
                      {v.status === "declined" && <Icons.X size={13} style={{ color: "var(--text-tertiary)" }} />}
                      {v.status === "qualified" && <Icons.Check size={13} style={{ color: "var(--pos)" }} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {v.status === "calling" ? `Call in progress - ${v.callDuration}` : v.callOutcome}
                        </div>
                        <div className="tiny" style={{ whiteSpace: "nowrap" }}>{v.lastUpdate}</div>
                      </div>
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => triggerCall(v.id)}
                      disabled={callingId === v.id}
                    >
                      <Icons.Phone size={12} /> {callingId === v.id ? "..." : "Call"}
                    </button>
                    {callMsg[v.id] && (
                      <div className="tiny" style={{ marginTop: 2, color: "var(--text-secondary)" }}>{callMsg[v.id]}</div>
                    )}
                  </td>
                  <td><Icons.Chev size={13} style={{ color: "var(--text-tertiary)" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

