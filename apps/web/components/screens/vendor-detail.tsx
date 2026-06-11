"use client";

import { useState } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { VENDORS, RFQ_DATA, THREAD_EVENTS } from "@/lib/data";
import { Icons } from "@/components/icons";
import { ThreadEventCard } from "../vendor/thread-event-card";
import { TranscriptViewer } from "../vendor/transcript-viewer";
import { DraftComposer } from "../vendor/draft-composer";
import { VendorStats } from "../vendor/vendor-stats";
import { VendorHeader } from "../vendor/vendor-header";
import { VendorSchema, Vendor } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function VendorDetail({ vendorId, onBack }: { vendorId: string; onBack: () => void }) {
  const [tab, setTab] = useState("thread");
  const [calling, setCalling] = useState(false);
  const [callMsg, setCallMsg] = useState<string | null>(null);

  const fetcher = async () => {
    if (!supabase) return { vendor: VENDORS.find(v => v.id === vendorId) || VENDORS[0], events: THREAD_EVENTS, callComplete: null };

    const [vRes, eRes, cRes] = await Promise.all([
      supabase.from("vendors").select("*").eq("id", vendorId).maybeSingle(),
      supabase.from("thread_events").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: true }),
      supabase.from("call_events").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: true }),
    ]);

    // Validate the vendor with Zod
    let validatedVendor = null;
    if (vRes.data) {
      const result = VendorSchema.safeParse(vRes.data);
      if (result.success) {
        validatedVendor = result.data as Vendor;
      } else {
        console.error("Zod validation failed for Vendor:", result.error);
        validatedVendor = vRes.data as unknown as Vendor; // Fallback
      }
    }

    const thread = (eRes.data ?? []);
    const callEvs = (cRes.data ?? []);
    
    let callComplete = null;
    const completedEv = callEvs.find((ce) => ce.event_type === "call_complete");
    
    if (completedEv?.payload) {
      const p = completedEv.payload;
      callComplete = {
        messages: p.messages ?? [],
        transcript_text: p.transcript ?? null,
        recording_url: p.recording_url ?? null,
        summary: p.summary ?? null,
        outcome: p.outcome ?? null,
        duration_seconds: p.duration_seconds != null ? Number(p.duration_seconds) : null,
        created_at: completedEv.created_at,
      };
    }

    const callEventCards = callEvs.map((ce) => {
      const when = new Date(ce.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      if (ce.event_type === "call_complete" && ce.payload) {
        const p = ce.payload;
        const outcome = p.outcome ?? "completed";
        const dur = p.duration_seconds != null ? `${Math.floor(p.duration_seconds / 60)}:${String(Math.round(p.duration_seconds % 60)).padStart(2, "0")}` : "-";
        const snippet = p.summary?.slice(0, 140);
        return {
          kind: "agent-note",
          who: "VendrSurf Agent",
          when,
          body: `Call complete - ${dur} - outcome: ${outcome}${snippet ? ` - "${snippet}"` : ""}`,
        };
      }
      return {
        kind: "agent-note",
        who: "Vapi - VendrSurf Agent",
        when,
        body: `${ce.event_type}${ce.status ? ` - ${ce.status}` : ""}`,
      };
    });

    return {
      vendor: validatedVendor || VENDORS[0],
      events: [...thread, ...callEventCards],
      callComplete
    };
  };

  const { data } = useSWR(`vendor-${vendorId}`, fetcher, { refreshInterval: 5000 });

  const vendor = data?.vendor ?? VENDORS.find(v => v.id === vendorId) ?? VENDORS[0];
  const events = data?.events ?? THREAD_EVENTS;
  const callComplete = data?.callComplete ?? null;
  const rfq = RFQ_DATA; // Mocked for now, in a real app would be fetched via SWR

  const triggerCall = async () => {
    if (!vendor?.rfq_id) { setCallMsg("No RFQ linked to this vendor."); return; }
    setCalling(true); setCallMsg(null);
    try {
      const r = await fetch(`${API_URL}/api/call-vendor`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rfq_id: vendor.rfq_id, vendor_id: vendor.id }),
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

  return (
    <div className="content fade-in max-w-[1280px]">
      <div className="flex mb-1.5">
        <button className="btn btn-ghost btn-sm -ml-2" onClick={onBack}>
          <Icons.Chev size={12} className="rotate-180" /> Back to RFQ
        </button>
      </div>

      <VendorHeader 
        vendor={vendor} 
        calling={calling} 
        callMsg={callMsg} 
        onTriggerCall={triggerCall} 
        canCall={!!vendor?.rfq_id} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div>
          <div className="tabs mb-[18px]">
            {[
              ["thread", "Activity"], 
              ["transcript", "Transcript"], 
              ["draft", "Draft"]
            ].map(([v, l]) => (
              <div key={v} className={`tab ${tab === v ? "active" : ""}`} onClick={() => setTab(v)}>
                {l}
                {v === "draft" && <span className="chip chip-accent ml-2 text-[10px]">1</span>}
              </div>
            ))}
          </div>

          {tab === "thread" && (
            <div className="flex flex-col gap-4">
              {events.map((ev, i) => <ThreadEventCard key={i} ev={ev} />)}
            </div>
          )}

          {tab === "transcript" && (
            <TranscriptViewer callComplete={callComplete} />
          )}

          {tab === "draft" && (
            <DraftComposer 
              vendorName={vendor.contact?.name || vendor.name} 
              vendorEmail={vendor.contact?.email || "unknown@example.com"}
              initialSubject="Re: RFQ: 500 units CNC aluminum enclosures - final request"
              initialBody={`Diane,\n\nThanks again for the quick turnaround on quoting.\n\nWe're ready to move forward with ${vendor.name} as primary for this 500-unit run. A few final items before PO goes out:\n\n1. Confirm $42.00/unit flat at qty 500 (per your 4:12 PM email).\n2. Confirm 28-day lead time starts the day PO lands - Friday EOD this week at the latest.\n3. Confirm payment terms 2% / net 15.\n4. First article inspection report with your standard PPAP - Level 3 if you can support it.\n\nPlease reply confirming all four and I'll have purchasing send the PO over this afternoon.\n\nBest,\nMia - VendrSurf Agent\non behalf of Blackbird Robotics`}
            />
          )}
        </div>

        <VendorStats vendor={vendor} rfq={rfq} />
      </div>
    </div>
  );
}
