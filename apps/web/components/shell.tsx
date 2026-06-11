"use client";

import { CURRENT_USER, WORKSPACE } from "@/lib/data";
import { Icons, Logo } from "./icons";
import { VendorStatus } from "@/lib/data";

export function Sidebar({ onHome, onNewRfq }: { onHome: () => void; onNewRfq: () => void }) {
  return (
    <aside className="sidebar">
      <div className="brand" style={{ cursor: "pointer" }} onClick={onHome}>
        <div className="brand-mark"><Logo /></div>
        <div className="brand-name">VendrSurf</div>
      </div>

      <div className="workspace">
        <div className="workspace-avatar">{WORKSPACE.initials}</div>
        <div className="workspace-name">{WORKSPACE.name}</div>
        <div className="workspace-chev"><Icons.ChevDown size={14} /></div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <button
          className="btn btn-primary"
          style={{ margin: "4px 4px 14px", width: "calc(100% - 8px)", justifyContent: "center", padding: "8px 10px" }}
          onClick={onNewRfq}
        >
          <Icons.Plus size={14} /> New RFQ
        </button>
        <div className="nav-item active" onClick={onHome}>
          <Icons.Rfq size={16} />
          <span>Dashboard</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{CURRENT_USER.initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="user-name">{CURRENT_USER.name}</div>
            <div className="user-email">{CURRENT_USER.email}</div>
          </div>
          <Icons.ChevDown size={14} />
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ crumbs }: { crumbs: string[] }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <span className="sep"><Icons.Chev size={12} /></span>}
            <span className={i === crumbs.length - 1 ? "cur" : ""}>{c}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function StatusChip({ status }: { status: VendorStatus | "active" | "closed" }) {
  const map: Record<string, { cls: string; label: string; dot?: boolean }> = {
    discovered: { cls: "chip-neutral", label: "Discovered" },
    calling:   { cls: "chip-warn",    label: "Calling" },
    voicemail: { cls: "chip-neutral", label: "Voicemail left" },
    responded: { cls: "chip-info",    label: "Responded" },
    qualified: { cls: "chip-info",    label: "Qualified" },
    quoted:    { cls: "chip-pos",     label: "Quoted" },
    emailing:  { cls: "chip-info",    label: "Negotiating" },
    completed: { cls: "chip-pos",     label: "Completed" },
    "no-response": { cls: "chip-neutral", label: "No response" },
    declined:  { cls: "chip-neutral", label: "Declined" },
    active:    { cls: "chip-pos",     label: "Active", dot: true },
    closed:    { cls: "chip-neutral", label: "Closed" },
  };
  const m = map[status] ?? { cls: "chip-neutral", label: status };

  if (status === "calling") {
    return (
      <span className={`chip ${m.cls}`} style={{ gap: 6 }}>
        <span className="pulse-dot" />
        {m.label}
      </span>
    );
  }
  return <span className={`chip ${m.cls} ${m.dot ? "chip-dot" : ""}`}>{m.label}</span>;
}

export function FitBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "var(--pos)" :
    score >= 75 ? "var(--surf)" :
    score >= 65 ? "var(--warn)" : "var(--text-tertiary)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 80 }}>
      <div style={{ flex: 1, height: 4, background: "var(--bg-sunken)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <span className="mono" style={{ fontSize: 11, color: "var(--text-secondary)", minWidth: 18 }}>{score}</span>
    </div>
  );
}
