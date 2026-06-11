"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { RFQ_DATA, VENDORS } from "@/lib/data";
import { StatusChip } from "@/components/status-chip";
import { Icons } from "@/components/icons";
import { VendorSchema, Vendor } from "@/lib/types";

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

export function RfqDetail({ rfqId, onBack, onOpenVendor }: { rfqId: string; onBack: () => void; onOpenVendor: (id: string) => void }) {
  const [filter, setFilter] = useState("all");
  const [callingId, setCallingId] = useState<string | null>(null);
  const [callMsg, setCallMsg] = useState<Record<string, string>>({});
  const isFixture = rfqId === RFQ_DATA.id;

  const fetcher = async () => {
    if (!supabase) return { rfqRow: null, vendors: isFixture ? VENDORS : [] };

    const [rRes, vRes] = await Promise.all([
      supabase.from("rfqs").select("*").eq("id", rfqId).maybeSingle(),
      supabase.from("vendors").select("*").eq("rfq_id", rfqId)
    ]);

    const rfqRow = rRes.data as RfqRow | null;
    
    let parsedVendors: Vendor[] = [];
    if (vRes.data && vRes.data.length > 0) {
      parsedVendors = vRes.data.map(v => {
        const res = VendorSchema.safeParse(v);
        return res.success ? (res.data as Vendor) : (v as unknown as Vendor);
      });
    } else if (isFixture) {
      parsedVendors = VENDORS;
    }

    return { rfqRow, vendors: parsedVendors };
  };

  const { data, isLoading } = useSWR(`rfq-${rfqId}`, fetcher, { refreshInterval: 5000 });

  const rfqRow = data?.rfqRow ?? null;
  // We use state to allow live ticking of call duration locally between SWR polls
  const [vendors, setVendors] = useState<Vendor[]>(data?.vendors ?? []);

  // Update local vendors when SWR data changes
  useEffect(() => {
    if (data?.vendors) setVendors(data.vendors);
  }, [data?.vendors]);

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
          if (v.status === "calling" && v.call_duration) {
            const [m, s] = v.call_duration.split(":").map(Number);
            const total = m * 60 + s + 1;
            return { ...v, call_duration: `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}` };
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
    <div className="content fade-in max-w-[1280px]">
      <div className="flex mb-1.5">
        <button className="btn btn-ghost btn-sm -ml-2" onClick={onBack}>
          <Icons.Chev size={12} className="rotate-180" /> Dashboard
        </button>
      </div>

      <div className="flex mb-1 items-start">
        <div>
          <div className="flex gap-2.5 mb-1.5 items-center">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{rfq.id}</span>
            <StatusChip status="active" />
          </div>
          <h1 className="h1">{rfq.title}</h1>
          <div className="text-[13.5px] text-[var(--text-secondary)] mt-1">
            {rfq.summary} - launched {rfq.created}
            {rfq.targetUnit ? ` - target $${rfq.targetUnit}/unit` : ""}
            {rfq.walkAwayUnit ? ` - walk-away $${rfq.walkAwayUnit}` : ""}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn"><Icons.Download size={13} /> Export</button>
      </div>

      <div className="grid grid-cols-5 gap-3 mt-5 mb-5">
        <div className="card stat"><div className="stat-label">Reached out</div><div className="stat-value">{counts.all}</div></div>
        <div className="card stat">
          <div className="stat-label">Live calls</div>
          <div className="stat-value text-[var(--warn)] flex items-center gap-2">
            {counts.calling}{counts.calling > 0 && <span className="pulse-dot" />}
          </div>
        </div>
        <div className="card stat"><div className="stat-label">Qualified</div><div className="stat-value text-[var(--info)]">{counts.qualified}</div></div>
        <div className="card stat"><div className="stat-label">Quoted</div><div className="stat-value text-[var(--pos)]">{counts.quoted}</div></div>
        <div className="card stat"><div className="stat-label">Declined</div><div className="stat-value text-[var(--text-tertiary)]">{counts.declined}</div></div>
      </div>

      <div className="card mb-4">
        <div className="py-3 px-4 flex items-center gap-3 bg-gradient-to-r from-[var(--accent-soft)] to-transparent">
          <div className="pulse-dot bg-[var(--accent)]" />
          <div className="text-[13px] font-semibold">Agent is live</div>
          <div className="text-[12.5px] text-[var(--text-secondary)]">
            {counts.calling} calls active - {vendors.filter((v) => v.status === "emailing").length} email threads open - last action just now
          </div>
        </div>
      </div>

      <div className="flex mb-3">
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

      <div className="card overflow-hidden">
        {isLoading && vendors.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-tertiary)]">Loading vendors...</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-[22%]">Vendor</th>
                <th className="w-[140px]">Contact</th>
                <th className="w-[130px]">Status</th>
                <th className="w-[110px] text-right">Unit price</th>
                <th className="w-[90px] text-right">Lead</th>
                <th className="min-w-[240px]">Last action</th>
                <th className="w-[110px]"></th>
                <th className="w-[30px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="clickable" onClick={() => onOpenVendor(v.id)}>
                  <td>
                    <div className="font-semibold text-[13.5px]">{v.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{v.location || "-"} - {v.employees || "-"}</div>
                  </td>
                  <td>
                    <div className="text-[13px] font-semibold">{v.contact?.name || "-"}</div>
                    <div className="text-[11px] mt-0.5">{v.contact?.role || "-"}</div>
                  </td>
                  <td><StatusChip status={v.status} /></td>
                  <td className="text-right tabular-nums">
                    {v.unit_price != null ? (
                      <div>
                        <div className={`font-semibold ${v.unit_price <= rfq.targetUnit ? "text-[var(--pos)]" : "text-[var(--text)]"}`}>
                          ${v.unit_price.toFixed(2)}
                        </div>
                        <div className={`text-[11px] ${v.unit_price <= rfq.targetUnit ? "text-[var(--pos)]" : "text-[var(--text-tertiary)]"}`}>
                          {v.unit_price <= rfq.targetUnit
                            ? `-$${(rfq.targetUnit - v.unit_price).toFixed(2)}`
                            : `+$${(v.unit_price - rfq.targetUnit).toFixed(2)}`}
                        </div>
                      </div>
                    ) : <span className="text-[var(--text-tertiary)]">-</span>}
                  </td>
                  <td className="text-right tabular-nums text-[var(--text-secondary)]">
                    {v.lead_time != null ? `${v.lead_time}d` : "-"}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {v.status === "calling" && <Icons.Phone size={13} className="text-[var(--warn)]" />}
                      {["quoted", "emailing"].includes(v.status) && <Icons.Mail size={13} className="text-[var(--info)]" />}
                      {v.status === "voicemail" && <Icons.Mic size={13} className="text-[var(--text-tertiary)]" />}
                      {v.status === "declined" && <Icons.X size={13} className="text-[var(--text-tertiary)]" />}
                      {v.status === "qualified" && <Icons.Check size={13} className="text-[var(--pos)]" />}
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold whitespace-nowrap">
                          {v.status === "calling" ? `Call in progress - ${v.call_duration}` : v.call_outcome}
                        </div>
                        <div className="text-[11px] whitespace-nowrap">{v.last_update || "just now"}</div>
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
                      <div className="text-[11px] mt-0.5 text-[var(--text-secondary)]">{callMsg[v.id]}</div>
                    )}
                  </td>
                  <td><Icons.Chev size={13} className="text-[var(--text-tertiary)]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
