"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { VENDORS, RFQ_DATA, THREAD_EVENTS, Vendor } from "@/lib/data";
import { Sidebar, Topbar, FitBar } from "@/components/shell";
import { StatusChip } from "@/components/status-chip";
import { Icons } from "@/components/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ThreadEvent = (typeof THREAD_EVENTS)[number];

function ThreadEventCard({ ev }: { ev: ThreadEvent }) {
  if (ev.kind === "call") {
    return (
      <div className="card">
        <div className="card-header" style={{ justifyContent: "space-between" }}>
          <div className="row">
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--warn-soft)", color: "var(--warn)", display: "grid", placeItems: "center" }}>
              <Icons.Phone size={14} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Voice call - Round 1 qualification</div>
              <div className="tiny">{ev.when} - {ev.duration} - outcome: <strong style={{ color: "var(--pos)" }}>{ev.outcome}</strong></div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm"><Icons.Download size={12} /> Transcript</button>
        </div>
        <div className="card-body" style={{ padding: "16px 20px" }}>
          <div className="transcript">
            {ev.transcript?.map((l, i) => (
              <div key={i} className="trs-line">
                <div className="trs-time">{l.t}</div>
                <div className={`trs-who ${l.side === "agent" ? "agent" : ""}`}>{l.who}</div>
                <div style={{ color: l.side === "agent" ? "var(--text)" : "var(--text-secondary)" }}>{l.line}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (ev.kind === "email") {
    const isOut = ev.direction === "out";
    return (
      <div className="msg">
        <div className="msg-avatar" style={{ background: isOut ? "var(--accent)" : "#E8E8E4", color: isOut ? "white" : "var(--text)" }}>
          {isOut ? <Icons.Sparkle size={14} /> : ev.who.split(" ")[0][0]}
        </div>
        <div className="msg-body">
          <div className="msg-head">
            <span className="msg-who">{ev.who}</span>
            {isOut && <span className="chip chip-accent">agent</span>}
            <span className="msg-time">{ev.when}</span>
          </div>
          <div className="msg-bubble" style={isOut ? { background: "var(--accent-soft)", borderColor: "#D2E2E1" } : {}}>
            <div className="msg-subject">{ev.subject}</div>
            <div style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{ev.body}</div>
            {ev.attachments && ev.attachments.length > 0 && (
              <div className="msg-meta">
                <Icons.Paperclip size={11} />
                {ev.attachments.map((a, i) => (
                  <span key={i} className="link" style={{ fontSize: 11.5 }}>
                    {a}{i < ev.attachments!.length - 1 ? "," : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (ev.kind === "agent-note") {
    return (
      <div style={{ display: "flex", gap: 10, padding: "0 12px", alignItems: "center" }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icons.Sparkle size={11} />
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-secondary)", fontStyle: "italic" }}>
          <strong style={{ color: "var(--accent)", fontStyle: "normal" }}>Agent note</strong> - <span>{ev.when}</span> - {ev.body}
        </div>
      </div>
    );
  }

  return null;
}

type VendorRow = {
  id: string;
  rfq_id: string | null;
  name: string | null;
  location: string | null;
  employees: string | null;
  contact: { name?: string; role?: string; title?: string; linkedin?: string; phone?: string; email?: string } | null;
  status: string | null;
  unit_price: number | null;
  lead_time: number | null;
  moq: number | null;
  nre: number | null;
  certs: string[] | null;
  capabilities: string[] | null;
  fit_score: number | null;
  last_update: string | null;
  call_duration: string | null;
  call_outcome: string | null;
  summary: string | null;
};

export function VendorDetail({ vendorId, onBack }: { vendorId: string; onBack: () => void }) {
  const fixtureVendor = VENDORS.find((v) => v.id === vendorId);
  const [row, setRow] = useState<VendorRow | null>(null);
  const rfq = RFQ_DATA;
  const [events, setEvents] = useState<ThreadEvent[]>(fixtureVendor ? THREAD_EVENTS : []);
  const [tab, setTab] = useState("thread");
  const [draftSubject, setDraftSubject] = useState("Re: RFQ: 500 units CNC aluminum enclosures - final request");
  const [draftBody, setDraftBody] = useState(
`Diane,

Thanks again for the quick turnaround on quoting.

We're ready to move forward with Precision Machine Works as primary for this 500-unit run. A few final items before PO goes out:

1. Confirm $42.00/unit flat at qty 500 (per your 4:12 PM email).
2. Confirm 28-day lead time starts the day PO lands - Friday EOD this week at the latest.
3. Confirm payment terms 2% / net 15.
4. First article inspection report with your standard PPAP - Level 3 if you can support it.

Please reply confirming all four and I'll have purchasing send the PO over this afternoon.

Best,
Mia - VendrSurf Agent
on behalf of Blackbird Robotics`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [callComplete, setCallComplete] = useState<{
    messages: Array<{ role: string; message: string; time?: number }>;
    transcript_text: string | null;
    recording_url: string | null;
    summary: string | null;
    outcome: string | null;
    duration_seconds: number | null;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      if (!supabase) return;

      const [vRes, eRes, cRes] = await Promise.all([
        supabase.from("vendors").select("*").eq("id", vendorId).maybeSingle(),
        supabase.from("thread_events").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: true }),
        supabase.from("call_events").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      if (vRes.data) setRow(vRes.data as VendorRow);
      const thread = (eRes.data ?? []) as unknown as ThreadEvent[];
      const callEvs = (cRes.data ?? []) as Array<{
        event_type: string;
        status: string | null;
        payload: Record<string, unknown> | null;
        created_at: string;
      }>;
      const completedEv = callEvs.find((ce) => ce.event_type === "call_complete");
      if (completedEv?.payload) {
        const p = completedEv.payload as Record<string, unknown>;
        setCallComplete({
          messages: (p.messages as Array<{ role: string; message: string; time?: number }>) ?? [],
          transcript_text: (p.transcript as string) ?? null,
          recording_url: (p.recording_url as string) ?? null,
          summary: (p.summary as string) ?? null,
          outcome: (p.outcome as string) ?? null,
          duration_seconds: p.duration_seconds != null ? Number(p.duration_seconds) : null,
          created_at: completedEv.created_at,
        });
      }
      const fmtDur = (secs: number) =>
        `${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, "0")}`;
      const callEventCards: ThreadEvent[] = callEvs.map((ce) => {
        const when = new Date(ce.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
        if (ce.event_type === "call_complete" && ce.payload) {
          const p = ce.payload as Record<string, unknown>;
          const outcome = (p.outcome as string) ?? "completed";
          const dur = p.duration_seconds != null ? fmtDur(Number(p.duration_seconds)) : "-";
          const snippet = (p.summary as string | undefined)?.slice(0, 140);
          return {
            kind: "agent-note" as const,
            who: "VendrSurf Agent",
            when,
            body: `Call complete - ${dur} - outcome: ${outcome}${snippet ? ` - "${snippet}"` : ""}`,
          };
        }
        return {
          kind: "agent-note" as const,
          who: "Vapi - VendrSurf Agent",
          when,
          body: `${ce.event_type}${ce.status ? ` - ${ce.status}` : ""}`,
        };
      });
      const combined = [...thread, ...callEventCards];
      if (combined.length > 0) setEvents(combined);
      else if (!fixtureVendor) setEvents([]);
    };
    fetchAll();
    const poll = setInterval(fetchAll, 5000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [vendorId, fixtureVendor]);

  const send = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1400);
  };

  const vendor = row
    ? {
        id: row.id,
        name: row.name ?? "Unknown",
        location: row.location ?? "-",
        employees: row.employees ?? "-",
        contact: {
          name: row.contact?.name ?? "-",
          role: row.contact?.role ?? row.contact?.title ?? "",
          linkedin: row.contact?.linkedin,
          phone: row.contact?.phone,
          email: row.contact?.email,
        },
        status: (row.status ?? "discovered") as Vendor["status"],
        unitPrice: row.unit_price,
        leadTime: row.lead_time,
        moq: row.moq,
        nre: row.nre,
        certs: row.certs ?? [],
        capabilities: row.capabilities ?? [],
        fitScore: row.fit_score ?? 0,
        callDuration: row.call_duration ?? "0:00",
        callOutcome: row.call_outcome ?? "Awaiting outreach",
        summary: row.summary ?? "",
      }
    : (fixtureVendor ?? VENDORS[0]);

  const [calling, setCalling] = useState(false);
  const [callMsg, setCallMsg] = useState<string | null>(null);
  const triggerCall = async () => {
    if (!row?.rfq_id) { setCallMsg("No RFQ linked to this vendor."); return; }
    setCalling(true); setCallMsg(null);
    try {
      const r = await fetch(`${API_URL}/api/call-vendor`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rfq_id: row.rfq_id, vendor_id: row.id }),
      });
      const j = await r.json().catch(() => ({ detail: `HTTP ${r.status}` }));
      if (!r.ok) throw new Error(j?.detail ?? j?.message ?? `HTTP ${r.status}`);
      setCallMsg(`Call triggered - ${j.call_id ?? "ok"}`);
    } catch (e) {
      setCallMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCalling(false);
    }
  };

  const initials = (vendor.contact.name || "?").split(" ").map((s) => s[0]).join("");

  return (
    <div className="content fade-in" style={{ maxWidth: 1280 }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginLeft: -8 }}>
          <Icons.Chev size={12} style={{ transform: "rotate(180deg)" }} /> Back to RFQ
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 6 }}>
            <h1 className="h1">{vendor.name}</h1>
            <StatusChip status={vendor.status} />
          </div>
          <div className="row muted" style={{ fontSize: 13.5, gap: 14, flexWrap: "wrap" }}>
            <span>{vendor.location}</span>
            <span style={{ color: "var(--border-strong)" }}>-</span>
            <span>{vendor.employees} employees</span>
            <span style={{ color: "var(--border-strong)" }}>-</span>
            <span>Fit {vendor.fitScore}</span>
            <span style={{ color: "var(--border-strong)" }}>-</span>
            <span className="row" style={{ gap: 4 }}><Icons.Link size={12} />{vendor.contact.linkedin}</span>
          </div>
        </div>
        <div className="col" style={{ alignItems: "flex-end", gap: 6 }}>
          <button className="btn btn-primary" onClick={triggerCall} disabled={calling || !row?.rfq_id}>
            <Icons.Phone size={13} /> {calling ? "Calling..." : "Call vendor"}
          </button>
          {callMsg && <div className="tiny" style={{ color: "var(--text-secondary)" }}>{callMsg}</div>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        <div>
          <div className="tabs" style={{ marginBottom: 18 }}>
            {(
              [["thread", "Activity"], ["transcript", "Transcript"], ["draft", "Draft"]] as [string, string][]
            ).map(([v, l]) => (
              <div key={v} className={`tab ${tab === v ? "active" : ""}`} onClick={() => setTab(v)}>
                {l}
                {v === "draft" && <span className="chip chip-accent" style={{ marginLeft: 8, fontSize: 10 }}>1</span>}
              </div>
            ))}
          </div>

          {tab === "thread" && (
            <div className="col" style={{ gap: 16 }}>
              {events.map((ev, i) => <ThreadEventCard key={i} ev={ev} />)}
            </div>
          )}

          {tab === "transcript" && (() => {
            if (!callComplete) {
              return (
                <div className="card card-pad">
                  <div className="muted" style={{ fontSize: 13 }}>No transcript yet - trigger a call to see it here.</div>
                </div>
              );
            }
            const { messages, transcript_text, recording_url, outcome, duration_seconds, created_at } = callComplete;
            const dur = duration_seconds != null
              ? `${Math.floor(duration_seconds / 60)}:${String(Math.round(duration_seconds % 60)).padStart(2, "0")}`
              : "-";
            const when = new Date(created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
            const lines = messages.length > 0 ? messages : null;
            return (
              <div className="card">
                <div className="card-header" style={{ justifyContent: "space-between" }}>
                  <div className="row">
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--warn-soft)", color: "var(--warn)", display: "grid", placeItems: "center" }}>
                      <Icons.Phone size={14} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>Round 1 qualification call</div>
                      <div className="tiny">{when} - {dur} - <strong style={{ color: "var(--pos)" }}>{outcome ?? "completed"}</strong></div>
                    </div>
                  </div>
                </div>
                {recording_url && (
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                    <audio controls src={recording_url} style={{ width: "100%", height: 36 }} />
                  </div>
                )}
                <div className="card-body" style={{ padding: "16px 20px" }}>
                  {lines ? (
                    <div className="transcript">
                      {lines.map((l, i) => {
                        const isAgent = l.role === "assistant" || l.role === "agent";
                        return (
                          <div key={i} className="trs-line">
                            <div className={`trs-who ${isAgent ? "agent" : ""}`}>{isAgent ? "Agent" : "Vendor"}</div>
                            <div style={{ color: isAgent ? "var(--text)" : "var(--text-secondary)" }}>{l.message}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : transcript_text ? (
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{transcript_text}</pre>
                  ) : (
                    <div className="muted" style={{ fontSize: 13 }}>Transcript not available.</div>
                  )}
                </div>
              </div>
            );
          })()}

          {tab === "draft" && (
            <div className="card">
              <div className="card-header">
                <Icons.Sparkle size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>Agent-drafted reply</div>
                  <div className="tiny">Edit and send - final request</div>
                </div>
                <div className="spacer" />
                {sent && <span className="chip chip-pos chip-dot">Sent</span>}
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  {[
                    ["From", "Mia - VendrSurf Agent <agent@vendrsurf.com>"],
                    ["To", `${vendor.contact.name} <${vendor.contact.email}>`],
                    ["CC", "sam@blackbird-robotics.com"],
                  ].map(([label, val]) => (
                    <div key={label} className="row" style={{ gap: 10, fontSize: 12.5, marginBottom: 6 }}>
                      <span className="muted" style={{ width: 48 }}>{label}</span>
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
                  <input
                    className="input"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    style={{ border: "none", padding: 0, fontSize: 14, fontWeight: 600, background: "transparent" }}
                    disabled={sent}
                  />
                </div>
                <div style={{ padding: "6px 18px" }}>
                  <textarea
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    disabled={sent}
                    style={{
                      width: "100%", border: "none", outline: "none", resize: "vertical",
                      minHeight: 340, padding: "10px 0", fontSize: 13.5, lineHeight: 1.6,
                      fontFamily: "inherit", background: "transparent", color: "var(--text)",
                    }}
                  />
                </div>
                <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", background: "var(--bg-sunken)" }}>
                  <div className="row">
                    <div className="spacer" />
                    {!sent ? (
                      <>
                        <button className="btn btn-sm" disabled={sending}>Save draft</button>
                        <button className="btn btn-primary btn-sm" onClick={send} disabled={sending}>
                          {sending ? <><span className="pulse-dot" style={{ background: "white" }} /> Sending...</> : <>Send final request <Icons.Chev size={12} /></>}
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm" onClick={() => setSent(false)}><Icons.Refresh size={12} /> Undo send</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col" style={{ gap: 14 }}>
          <div className="card" style={{ borderColor: "var(--pos)", background: "linear-gradient(180deg, var(--pos-soft), var(--bg-elev) 60%)" }}>
            <div className="card-body" style={{ padding: 16 }}>
              <div className="row" style={{ marginBottom: 14 }}>
                <Icons.Quotes size={14} style={{ color: "var(--pos)" }} />
                <span className="h3" style={{ color: "var(--pos)" }}>Final quote</span>
                <div className="spacer" />
                {vendor.unitPrice && (
                  <span className="chip chip-pos">{vendor.unitPrice <= rfq.targetUnit ? "Below target" : "Above target"}</span>
                )}
              </div>
              {vendor.unitPrice ? (
                <>
                  <div style={{ marginBottom: 14 }}>
                    <div className="tiny" style={{ marginBottom: 2 }}>Unit price</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 22, color: "var(--pos)", fontVariantNumeric: "tabular-nums" }}>
                        ${vendor.unitPrice.toFixed(2)}
                      </span>
                      <span className="tiny">/ unit x 500</span>
                    </div>
                  </div>
                  <hr className="hr" style={{ margin: "14px 0 10px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="muted" style={{ fontSize: 12.5 }}>Total contract value</span>
                    <span style={{ fontWeight: 700, fontSize: 17, fontVariantNumeric: "tabular-nums" }}>
                      ${((vendor.unitPrice * 500) + (vendor.nre ?? 0)).toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="muted" style={{ fontSize: 13 }}>No formal quote yet - {vendor.callOutcome.toLowerCase()}.</div>
              )}
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title">Contact</h3>
            <div className="row" style={{ gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #14161A, #5B6067)", color: "white", display: "grid", placeItems: "center", fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{vendor.contact.name}</div>
                <div className="tiny">{vendor.contact.role}</div>
              </div>
            </div>
            <div className="col" style={{ gap: 6, fontSize: 12.5 }}>
              <div className="row"><Icons.Phone size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} /><span>{vendor.contact.phone}</span></div>
              <div className="row"><Icons.Mail size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} /><span style={{ wordBreak: "break-all" }}>{vendor.contact.email}</span></div>
              <div className="row"><Icons.Link size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} /><span className="link">{vendor.contact.linkedin}</span></div>
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title">Capabilities & certs</h3>
            <div className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {vendor.capabilities.map((c, i) => <span key={i} className="chip chip-neutral">{c}</span>)}
            </div>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {vendor.certs.map((c, i) => <span key={i} className="chip chip-accent">{c}</span>)}
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title">Agent summary</h3>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>{vendor.summary}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

