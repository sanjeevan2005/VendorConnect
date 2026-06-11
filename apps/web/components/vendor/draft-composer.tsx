"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

interface DraftComposerProps {
  vendorName: string;
  vendorEmail: string;
  initialSubject: string;
  initialBody: string;
}

export function DraftComposer({ vendorName, vendorEmail, initialSubject, initialBody }: DraftComposerProps) {
  const [draftSubject, setDraftSubject] = useState(initialSubject);
  const [draftBody, setDraftBody] = useState(initialBody);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = () => {
    setSending(true);
    setTimeout(() => { 
      setSending(false); 
      setSent(true); 
    }, 1400);
  };

  return (
    <div className="card">
      <div className="card-header">
        <Icons.Sparkle size={14} className="text-[var(--accent)] shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold text-[13.5px]">Agent-drafted reply</div>
          <div className="text-[11px] text-[var(--text-secondary)]">Edit and send - final request</div>
        </div>
        <div className="spacer" />
        {sent && <span className="chip chip-pos chip-dot">Sent</span>}
      </div>
      
      <div className="p-0">
        <div className="py-3.5 px-4 border-b border-[var(--border)]">
          {[
            ["From", "Mia - VendrSurf Agent <agent@vendrsurf.com>"],
            ["To", `${vendorName} <${vendorEmail}>`],
            ["CC", "sam@blackbird-robotics.com"],
          ].map(([label, val]) => (
            <div key={label} className="flex gap-2.5 text-[12.5px] mb-1.5">
              <span className="text-[var(--text-secondary)] w-12">{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
        
        <div className="py-3.5 px-4 border-b border-[var(--border)]">
          <input
            className="w-full border-none p-0 text-[14px] font-semibold bg-transparent outline-none"
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            disabled={sent}
          />
        </div>
        
        <div className="py-1.5 px-4">
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            disabled={sent}
            className="w-full border-none outline-none resize-y min-h-[340px] py-2.5 text-[13.5px] leading-relaxed font-inherit bg-transparent text-[var(--text)]"
          />
        </div>
        
        <div className="py-3 px-4 border-t border-[var(--border)] bg-[var(--bg-sunken)]">
          <div className="flex">
            <div className="spacer" />
            {!sent ? (
              <div className="flex gap-2">
                <button className="btn btn-sm" disabled={sending}>Save draft</button>
                <button className="btn btn-primary btn-sm" onClick={send} disabled={sending}>
                  {sending ? (
                    <><span className="pulse-dot bg-white" /> Sending...</>
                  ) : (
                    <>Send final request <Icons.Chev size={12} /></>
                  )}
                </button>
              </div>
            ) : (
              <button className="btn btn-sm" onClick={() => setSent(false)}>
                <Icons.Refresh size={12} /> Undo send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
