import { Icons } from "@/components/icons";
import { StatusChip } from "@/components/status-chip";
import { Vendor } from "@/lib/types";

interface VendorTableProps {
  vendors: Vendor[];
  rfqTargetUnit: number;
  callingId: string | null;
  callMsg: Record<string, string>;
  triggerCall: (vendorId: string) => void;
  onOpenVendor: (vendorId: string) => void;
  isLoading: boolean;
}

export function VendorTable({
  vendors,
  rfqTargetUnit,
  callingId,
  callMsg,
  triggerCall,
  onOpenVendor,
  isLoading,
}: VendorTableProps) {
  if (isLoading && vendors.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="p-8 text-center text-[var(--text-tertiary)]">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="tbl">
        <thead>
          <tr>
            <th className="w-[22%]">Vendor</th>
            <th className="w-[140px]">Contact</th>
            <th className="w-[130px]">Status</th>
            <th className="w-[110px] text-right">Unit price</th>
            <th className="w-[90px] text-right">Lead</th>
            <th className="min-w-[240px]">Last action</th>
            <th className="w-[110px]"></th>
            <th className="w-[30px]"></th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id} className="clickable" onClick={() => onOpenVendor(v.id)}>
              <td>
                <div className="font-semibold text-[13.5px]">{v.name}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {v.location || "-"} - {v.employees || "-"}
                </div>
              </td>
              <td>
                <div className="text-[13px] font-semibold">{v.contact?.name || "-"}</div>
                <div className="text-[11px] mt-0.5">{v.contact?.role || "-"}</div>
              </td>
              <td>
                <StatusChip status={v.status} />
              </td>
              <td className="text-right tabular-nums">
                {v.unit_price != null ? (
                  <div>
                    <div className={`font-semibold ${v.unit_price <= rfqTargetUnit ? "text-[var(--pos)]" : "text-[var(--text)]"}`}>
                      ${v.unit_price.toFixed(2)}
                    </div>
                    <div className={`text-[11px] ${v.unit_price <= rfqTargetUnit ? "text-[var(--pos)]" : "text-[var(--text-tertiary)]"}`}>
                      {v.unit_price <= rfqTargetUnit
                        ? `-$${(rfqTargetUnit - v.unit_price).toFixed(2)}`
                        : `+$${(v.unit_price - rfqTargetUnit).toFixed(2)}`}
                    </div>
                  </div>
                ) : (
                  <span className="text-[var(--text-tertiary)]">-</span>
                )}
              </td>
              <td className="text-right tabular-nums text-[var(--text-secondary)]">
                {v.lead_time != null ? `${v.lead_time}d` : "-"}
              </td>
              <td>
                <div className="flex gap-2">
                  {v.status === "calling" && <Icons.Phone size={13} className="text-[var(--warn)]" />}
                  {["quoted", "emailing"].includes(v.status) && <Icons.Mail size={13} className="text-[var(--info)]" />}
                  {v.status === "voicemail" && <Icons.Mic size={13} className="text-[var(--text-tertiary)]" />}
                  {v.status === "declined" && <Icons.X size={13} className="text-[var(--text-tertiary)]" />}
                  {v.status === "qualified" && <Icons.Check size={13} className="text-[var(--pos)]" />}
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold whitespace-nowrap">
                      {v.status === "calling" ? `Call in progress - ${v.call_duration}` : v.call_outcome}
                    </div>
                    <div className="text-[11px] whitespace-nowrap">{v.last_update || "just now"}</div>
                  </div>
                </div>
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => triggerCall(v.id)}
                  disabled={callingId === v.id}
                >
                  <Icons.Phone size={12} /> {callingId === v.id ? "..." : "Call"}
                </button>
                {callMsg[v.id] && (
                  <div className="text-[11px] mt-0.5 text-[var(--text-secondary)]">{callMsg[v.id]}</div>
                )}
              </td>
              <td>
                <Icons.Chev size={13} className="text-[var(--text-tertiary)]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
