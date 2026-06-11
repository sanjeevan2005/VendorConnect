interface RfqStatsProps {
  counts: {
    all: number;
    discovered: number;
    calling: number;
    qualified: number;
    quoted: number;
    voicemail: number;
    declined: number;
  };
  emailingCount: number;
}

export function RfqStats({ counts, emailingCount }: RfqStatsProps) {
  return (
    <>
      <div className="grid grid-cols-5 gap-3 mt-5 mb-5">
        <div className="card stat">
          <div className="stat-label">Reached out</div>
          <div className="stat-value">{counts.all}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Live calls</div>
          <div className="stat-value text-[var(--warn)] flex items-center gap-2">
            {counts.calling}
            {counts.calling > 0 && <span className="pulse-dot" />}
          </div>
        </div>
        <div className="card stat">
          <div className="stat-label">Qualified</div>
          <div className="stat-value text-[var(--info)]">{counts.qualified}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Quoted</div>
          <div className="stat-value text-[var(--pos)]">{counts.quoted}</div>
        </div>
        <div className="card stat">
          <div className="stat-label">Declined</div>
          <div className="stat-value text-[var(--text-tertiary)]">{counts.declined}</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="py-3 px-4 flex items-center gap-3 bg-gradient-to-r from-[var(--accent-soft)] to-transparent">
          <div className="pulse-dot bg-[var(--accent)]" />
          <div className="text-[13px] font-semibold">Agent is live</div>
          <div className="text-[12.5px] text-[var(--text-secondary)]">
            {counts.calling} calls active - {emailingCount} email threads open - last action just now
          </div>
        </div>
      </div>
    </>
  );
}
