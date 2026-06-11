"use client";

import useSWR from "swr";
import { DASHBOARD_RFQS } from "@/lib/data";
import { DashboardRFQ } from "@/lib/types";
import { Icons } from "@/components/icons";
import { DashboardStats } from "../dashboard/dashboard-stats";
import { RfqList } from "../dashboard/rfq-list";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RfqRow {
  id: string;
  title: string;
  quantity: number;
  status: string;
  created_at: string;
  target_unit: number | null;
  target_unit_price: number | null;
}

export function Dashboard({ onOpenRfq, onNewRfq }: { onOpenRfq: (id: string) => void; onNewRfq: () => void }) {
  const fetcher = async () => {
    try {
      const r = await fetch(`${API_URL}/api/rfqs`);
      if (!r.ok) return DASHBOARD_RFQS;
      const { data } = await r.json();
      if (!data || data.length === 0) return DASHBOARD_RFQS;
    
    return data.map((r: RfqRow) => ({
      id: r.id,
      title: r.title,
      qty: r.quantity,
      status: r.status,
      created: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      vendors: 12,
      quotes: 3,
      target: r.target_unit ?? r.target_unit_price,
      bestQuote: null as number | null,
    }));
    } catch {
      return DASHBOARD_RFQS;
    }
  };

  const { data: rfqs, isLoading: loading } = useSWR("rfqs", fetcher, {
    fallbackData: DASHBOARD_RFQS,
    refreshInterval: 5000,
  });

  const active = rfqs.filter((r: DashboardRFQ) => r.status === "active");
  const totalVendors = rfqs.reduce((a: number, r: DashboardRFQ) => a + r.vendors, 0);
  const totalQuotes = rfqs.reduce((a: number, r: DashboardRFQ) => a + r.quotes, 0);
  const liveCalls = 2;

  return (
    <div className="content fade-in max-w-[1280px]">
      <div className="row mb-[22px]">
        <div>
          <h1 className="h1">Dashboard</h1>
          <div className="muted mt-1 text-[13.5px]">
            Your active sourcing campaigns - agent is running outreach live.
          </div>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={onNewRfq}>
          <Icons.Plus size={13} /> New RFQ
        </button>
      </div>

      <DashboardStats
        activeCount={active.length}
        totalCount={rfqs.length}
        liveCalls={liveCalls}
        totalVendors={totalVendors}
        totalQuotes={totalQuotes}
      />

      <h2 className="h2 mb-3">Your RFQs</h2>
      
      <RfqList rfqs={rfqs} isLoading={loading} onOpenRfq={onOpenRfq} />
    </div>
  );
}

