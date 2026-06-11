"use client";

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { DASHBOARD_RFQS } from "@/lib/data";
import { Sidebar, Topbar } from "@/components/shell";
import { StatusChip } from "@/components/status-chip";
import { Icons } from "@/components/icons";

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
    if (!supabase) return DASHBOARD_RFQS;
    const { data, error } = await supabase.from("rfqs").select("*");
    if (error) throw error;
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
  };

  const { data: rfqs, isLoading: loading } = useSWR("rfqs", fetcher, {
    fallbackData: DASHBOARD_RFQS,
    refreshInterval: 5000,
  });

  const active = rfqs.filter((r) => r.status === "active");
  const totalVendors = rfqs.reduce((a, r) => a + r.vendors, 0);
  const totalQuotes = rfqs.reduce((a, r) => a + r.quotes, 0);
  const liveCalls = 2;

  return (
    <div className="content fade-in" style={{ maxWidth: 1280 }}>
      <div className="row" style={{ marginBottom: 22 }}>
        <div>
          <h1 className="h1">Dashboard</h1>
          <div className="muted" style={{ marginTop: 4, fontSize: 13.5 }}>
            Your active sourcing campaigns - agent is running outreach live.
          </div>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={onNewRfq}>
          <Icons.Plus size={13} /> New RFQ
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        <div className="card stat">
          <div className="stat-label">Active RFQs</div>
          <div className="stat-value">{active.length}</div>
          <div className="stat-delta muted">of {rfqs.length} total</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Live calls</div>
          <div className="stat-value" style={{ color: "var(--warn)", display: "flex", alignItems: "center", gap: 8 }}>
            {liveCalls}<span className="pulse-dot" />
          </div>
          <div className="stat-delta muted">parallel outreach</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Vendors contacted</div>
          <div className="stat-value">{totalVendors}</div>
          <div className="stat-delta muted">across all campaigns</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Quotes received</div>
          <div className="stat-value" style={{ color: "var(--pos)" }}>{totalQuotes}</div>
          <div className="stat-delta muted">6 awaiting your review</div>
        </div>
      </div>

      <h2 className="h2" style={{ marginBottom: 12 }}>Your RFQs</h2>
      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>Loading...</div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 150 }}>ID</th>
                <th>Title</th>
                <th style={{ width: 80, textAlign: "right" }}>Qty</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 100, textAlign: "right" }}>Vendors</th>
                <th style={{ width: 100, textAlign: "right" }}>Quotes</th>
                <th style={{ width: 120, textAlign: "right" }}>Target</th>
                <th style={{ width: 130, textAlign: "right" }}>Best quote</th>
                <th style={{ width: 90 }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map((r) => (
                <tr key={r.id} className="clickable" onClick={() => onOpenRfq(r.id)}>
                  <td className="mono" style={{ color: "var(--text-secondary)", fontSize: 12.5 }}>{r.id}</td>
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.qty.toLocaleString()}</td>
                  <td><StatusChip status={r.status as "active" | "closed"} /></td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>{r.vendors}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{r.quotes}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                    {r.target ? `$${r.target.toFixed(2)}` : "-"}
                  </td>
                  <td style={{
                    textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600,
                    color: r.bestQuote && r.target && r.bestQuote <= r.target ? "var(--pos)" : "var(--text)",
                  }}>
                    {r.bestQuote ? `$${r.bestQuote.toFixed(2)}` : "-"}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{r.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

