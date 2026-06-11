"use client";

import { Icons } from "@/components/icons";
import { StatusChip } from "@/components/status-chip";
import { Vendor } from "@/lib/types";

interface VendorHeaderProps {
  vendor: Vendor;
  calling: boolean;
  callMsg: string | null;
  onTriggerCall: () => void;
  canCall: boolean;
}

export function VendorHeader({ vendor, calling, callMsg, onTriggerCall, canCall }: VendorHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-[18px]">
      <div>
        <div className="flex gap-2.5 mb-1.5 items-center">
          <h1 className="h1">{vendor.name}</h1>
          <StatusChip status={vendor.status} />
        </div>
        <div className="flex flex-wrap gap-3.5 text-[13.5px] text-[var(--text-secondary)] items-center">
          <span>{vendor.location || "-"}</span>
          <span className="text-[var(--border-strong)]">-</span>
          <span>{vendor.employees || "-"} employees</span>
          <span className="text-[var(--border-strong)]">-</span>
          <span>Fit {vendor.fit_score ?? 0}</span>
          <span className="text-[var(--border-strong)]">-</span>
          <span className="flex gap-1 items-center">
            <Icons.Link size={12} />
            {vendor.contact?.linkedin || "-"}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <button 
          className="btn btn-primary" 
          onClick={onTriggerCall} 
          disabled={calling || !canCall}
        >
          <Icons.Phone size={13} /> {calling ? "Calling..." : "Call vendor"}
        </button>
        {callMsg && (
          <div className="text-[11px] text-[var(--text-secondary)]">
            {callMsg}
          </div>
        )}
      </div>
    </div>
  );
}
