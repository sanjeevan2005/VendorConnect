"use client";

import { ThreadEvent } from "@/lib/types";
import { Icons } from "@/components/icons";

export function ThreadEventCard({ ev }: { ev: ThreadEvent }) {
  if (ev.kind === "call") {
    return (
      <div className="card">
        <div className="card-header justify-between">
          <div className="flex gap-2.5 items-center">
            <div className="w-8 h-8 rounded-lg bg-[var(--warn-soft)] text-[var(--warn)] grid place-items-center">
              <Icons.Phone size={14} />
            </div>
            <div>
              <div className="font-semibold text-[13.5px]">Voice call - Round 1 qualification</div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                {ev.when} - {ev.duration} - outcome: <strong className="text-[var(--pos)]">{ev.outcome}</strong>
              </div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm"><Icons.Download size={12} /> Transcript</button>
        </div>
        <div className="p-4 px-5">
          <div className="transcript">
            {ev.transcript?.map((l, i) => (
              <div key={i} className="flex gap-3 mb-1.5 text-[13px]">
                <div className="w-10 text-[var(--text-tertiary)] shrink-0">{l.t}</div>
                <div className={`w-14 font-medium shrink-0 ${l.side === "agent" ? "text-[var(--text)]" : "text-[var(--text-secondary)]"}`}>
                  {l.who}
                </div>
                <div className={l.side === "agent" ? "text-[var(--text)]" : "text-[var(--text-secondary)]"}>
                  {l.line}
                </div>
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
      <div className="flex gap-3 mt-4">
        <div 
          className={`w-8 h-8 rounded-full grid place-items-center text-xs font-semibold shrink-0 ${isOut ? "bg-[var(--accent)] text-white" : "bg-[#E8E8E4] text-[var(--text)]"}`}
        >
          {isOut ? <Icons.Sparkle size={14} /> : ev.who.split(" ")[0][0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[13px]">{ev.who}</span>
            {isOut && <span className="chip chip-accent">agent</span>}
            <span className="text-[11px] text-[var(--text-tertiary)]">{ev.when}</span>
          </div>
          <div className={`p-3.5 rounded-lg border border-[var(--border)] ${isOut ? "bg-[var(--accent-soft)] border-[#D2E2E1]" : "bg-white"}`}>
            <div className="font-semibold text-[13.5px] mb-1">{ev.subject}</div>
            <div className="whitespace-pre-wrap text-[var(--text-secondary)] text-[13px] leading-relaxed">{ev.body}</div>
            {ev.attachments && ev.attachments.length > 0 && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-light)] text-[var(--text-secondary)] items-center">
                <Icons.Paperclip size={11} />
                {ev.attachments.map((a, i) => (
                  <span key={i} className="link text-[11.5px]">
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
      <div className="flex gap-2.5 px-3 items-center mt-2">
        <div className="w-[22px] h-[22px] rounded-md bg-[var(--accent-soft)] text-[var(--accent)] grid place-items-center shrink-0">
          <Icons.Sparkle size={11} />
        </div>
        <div className="text-[12.5px] text-[var(--text-secondary)] italic">
          <strong className="text-[var(--accent)] not-italic">Agent note</strong> - <span>{ev.when}</span> - {ev.body}
        </div>
      </div>
    );
  }

  return null;
}
