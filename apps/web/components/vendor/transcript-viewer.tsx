"use client";

import { Icons } from "@/components/icons";

interface CallCompleteData {
  messages: Array<{ role: string; message: string; time?: number }>;
  transcript_text: string | null;
  recording_url: string | null;
  outcome: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export function TranscriptViewer({ callComplete }: { callComplete: CallCompleteData | null }) {
  if (!callComplete) {
    return (
      <div className="card card-pad">
        <div className="text-[13px] text-[var(--text-secondary)]">
          No transcript yet - trigger a call to see it here.
        </div>
      </div>
    );
  }

  const { messages, transcript_text, recording_url, outcome, duration_seconds, created_at } = callComplete;
  
  const dur = duration_seconds != null
    ? `${Math.floor(duration_seconds / 60)}:${String(Math.round(duration_seconds % 60)).padStart(2, "0")}`
    : "-";
    
  const when = new Date(created_at).toLocaleString("en-US", { 
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit" 
  });
  
  const lines = messages.length > 0 ? messages : null;

  return (
    <div className="card">
      <div className="card-header justify-between">
        <div className="flex gap-2.5 items-center">
          <div className="w-[30px] h-[30px] rounded-lg bg-[var(--warn-soft)] text-[var(--warn)] grid place-items-center">
            <Icons.Phone size={14} />
          </div>
          <div>
            <div className="font-semibold text-[13.5px]">Round 1 qualification call</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {when} - {dur} - <strong className="text-[var(--pos)]">{outcome ?? "completed"}</strong>
            </div>
          </div>
        </div>
      </div>
      
      {recording_url && (
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <audio controls src={recording_url} className="w-full h-9" />
        </div>
      )}
      
      <div className="p-4 px-5">
        {lines ? (
          <div className="transcript">
            {lines.map((l, i) => {
              const isAgent = l.role === "assistant" || l.role === "agent";
              return (
                <div key={i} className="flex gap-3 mb-1.5 text-[13px]">
                  <div className={`w-14 font-medium shrink-0 ${isAgent ? "text-[var(--text)]" : "text-[var(--text-secondary)]"}`}>
                    {isAgent ? "Agent" : "Vendor"}
                  </div>
                  <div className={isAgent ? "text-[var(--text)]" : "text-[var(--text-secondary)]"}>
                    {l.message}
                  </div>
                </div>
              );
            })}
          </div>
        ) : transcript_text ? (
          <pre className="whitespace-pre-wrap text-[12.5px] text-[var(--text-secondary)] leading-relaxed m-0 font-sans">
            {transcript_text}
          </pre>
        ) : (
          <div className="text-[13px] text-[var(--text-secondary)]">Transcript not available.</div>
        )}
      </div>
    </div>
  );
}
