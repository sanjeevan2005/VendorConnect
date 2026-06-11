import React from "react";
import { VendorStatus } from "@/lib/types";

interface StatusChipProps {
  status: VendorStatus | "active" | "closed";
}

export const StatusChip = React.memo(function StatusChip({ status }: StatusChipProps) {
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
});
