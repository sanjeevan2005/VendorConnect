"use client";

import { Icons } from "@/components/icons";
import { Vendor, RFQ } from "@/lib/types";

interface VendorStatsProps {
  vendor: Vendor;
  rfq: RFQ;
}

export function VendorStats({ vendor, rfq }: VendorStatsProps) {
  const initials = (vendor.contact?.name || "?").split(" ").map((s) => s[0]).join("");

  return (
    <div className="flex flex-col gap-3.5">
      <div className="card border-[var(--pos)] bg-gradient-to-b from-[var(--pos-soft)] to-[var(--bg-elev)]">
        <div className="p-4">
          <div className="flex mb-3.5 items-center">
            <Icons.Quotes size={14} className="text-[var(--pos)] mr-2" />
            <span className="text-lg font-semibold text-[var(--pos)]">Final quote</span>
            <div className="spacer" />
            {vendor.unit_price && rfq.target_unit && (
              <span className="chip chip-pos">
                {vendor.unit_price <= rfq.target_unit ? "Below target" : "Above target"}
              </span>
            )}
          </div>
          
          {vendor.unit_price ? (
            <>
              <div className="mb-3.5">
                <div className="text-[11px] text-[var(--text-secondary)] mb-0.5">Unit price</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-[22px] text-[var(--pos)] tabular-nums">
                    ${vendor.unit_price.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)]">/ unit x {rfq.quantity || 500}</span>
                </div>
              </div>
              <hr className="border-t border-[var(--border)] my-3.5" />
              <div className="flex justify-between items-baseline">
                <span className="text-[12.5px] text-[var(--text-secondary)]">Total contract value</span>
                <span className="font-bold text-[17px] tabular-nums">
                  ${((vendor.unit_price * (rfq.quantity || 500)) + (vendor.nre ?? 0)).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <div className="text-[13px] text-[var(--text-secondary)]">
              No formal quote yet - {vendor.call_outcome?.toLowerCase() || "awaiting outreach"}.
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="section-title">Contact</h3>
        <div className="flex gap-2.5 mb-2.5 items-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#14161A] to-[#5B6067] text-white grid place-items-center font-semibold text-[13px] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13.5px]">{vendor.contact?.name || "Unknown"}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{vendor.contact?.role || vendor.contact?.title || ""}</div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 text-[12.5px]">
          <div className="flex items-center gap-2">
            <Icons.Phone size={12} className="text-[var(--text-tertiary)] shrink-0" />
            <span>{vendor.contact?.phone || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.Mail size={12} className="text-[var(--text-tertiary)] shrink-0" />
            <span className="break-all">{vendor.contact?.email || "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icons.Link size={12} className="text-[var(--text-tertiary)] shrink-0" />
            <span className="link">{vendor.contact?.linkedin || "-"}</span>
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="section-title">Capabilities & certs</h3>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {(vendor.capabilities || []).map((c, i) => (
            <span key={i} className="chip chip-neutral">{c}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(vendor.certs || []).map((c, i) => (
            <span key={i} className="chip chip-accent">{c}</span>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="section-title">Agent summary</h3>
        <div className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
          {vendor.summary || "No summary available."}
        </div>
      </div>
    </div>
  );
}
