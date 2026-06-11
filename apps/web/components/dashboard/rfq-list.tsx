import { StatusChip } from "@/components/status-chip";

interface RfqListProps {
  rfqs: any[];
  isLoading: boolean;
  onOpenRfq: (id: string) => void;
}

export function RfqList({ rfqs, isLoading, onOpenRfq }: RfqListProps) {
  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-8 text-center text-[var(--text-tertiary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="tbl">
        <thead>
          <tr>
            <th className="w-[150px]">ID</th>
            <th>Title</th>
            <th className="w-[80px] text-right">Qty</th>
            <th className="w-[110px]">Status</th>
            <th className="w-[100px] text-right">Vendors</th>
            <th className="w-[100px] text-right">Quotes</th>
            <th className="w-[120px] text-right">Target</th>
            <th className="w-[130px] text-right">Best quote</th>
            <th className="w-[90px]">Created</th>
          </tr>
        </thead>
        <tbody>
          {rfqs.map((r) => (
            <tr key={r.id} className="clickable" onClick={() => onOpenRfq(r.id)}>
              <td className="mono text-[var(--text-secondary)] text-[12.5px]">{r.id}</td>
              <td className="font-semibold">{r.title}</td>
              <td className="text-right tabular-nums">{r.qty.toLocaleString()}</td>
              <td>
                <StatusChip status={r.status as "active" | "closed"} />
              </td>
              <td className="text-right tabular-nums text-[var(--text-secondary)]">{r.vendors}</td>
              <td className="text-right tabular-nums font-semibold">{r.quotes}</td>
              <td className="text-right tabular-nums text-[var(--text-secondary)]">
                {r.target ? `$${r.target.toFixed(2)}` : "-"}
              </td>
              <td
                className={`text-right tabular-nums font-semibold ${
                  r.bestQuote && r.target && r.bestQuote <= r.target ? "text-[var(--pos)]" : "text-[var(--text)]"
                }`}
              >
                {r.bestQuote ? `$${r.bestQuote.toFixed(2)}` : "-"}
              </td>
              <td className="text-[var(--text-secondary)]">{r.created}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
