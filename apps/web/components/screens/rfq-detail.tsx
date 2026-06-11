"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { RFQ_DATA, VENDORS } from "@/lib/data";
import { VendorSchema, Vendor } from "@/lib/types";
import { RfqHeader } from "../rfq/rfq-header";
import { RfqStats } from "../rfq/rfq-stats";
import { VendorTable } from "../rfq/vendor-table";

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

  const { data, isLoading, mutate } = useSWR(`rfq-${rfqId}`, fetcher, { refreshInterval: 5000 });

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
      mutate();
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
      <RfqHeader rfq={rfq} onBack={onBack} />
      <RfqStats counts={counts} emailingCount={vendors.filter((v) => v.status === "emailing").length} />

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

      <VendorTable
        vendors={filtered}
        rfqTargetUnit={rfq.targetUnit}
        callingId={callingId}
        callMsg={callMsg}
        triggerCall={triggerCall}
        onOpenVendor={onOpenVendor}
        isLoading={isLoading}
      />
    </div>
  );
}
