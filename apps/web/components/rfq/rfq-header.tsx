import { Icons } from "@/components/icons";
import { StatusChip } from "@/components/status-chip";

interface RfqHeaderProps {
  rfq: {
    id: string;
    title: string;
    summary: string;
    created: string;
    targetUnit?: number;
    walkAwayUnit?: number;
  };
  onBack: () => void;
}

export function RfqHeader({ rfq, onBack }: RfqHeaderProps) {
  return (
    <>
      <div className="flex mb-1.5">
        <button className="btn btn-ghost btn-sm -ml-2" onClick={onBack}>
          <Icons.Chev size={12} className="rotate-180" /> Dashboard
        </button>
      </div>

      <div className="flex mb-1 items-start">
        <div>
          <div className="flex gap-2.5 mb-1.5 items-center">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{rfq.id}</span>
            <StatusChip status="active" />
          </div>
          <h1 className="h1">{rfq.title}</h1>
          <div className="text-[13.5px] text-[var(--text-secondary)] mt-1">
            {rfq.summary} - launched {rfq.created}
            {rfq.targetUnit ? ` - target $${rfq.targetUnit}/unit` : ""}
            {rfq.walkAwayUnit ? ` - walk-away $${rfq.walkAwayUnit}` : ""}
          </div>
        </div>
        <div className="spacer" />
        <button className="btn">
          <Icons.Download size={13} /> Export
        </button>
      </div>
    </>
  );
}
