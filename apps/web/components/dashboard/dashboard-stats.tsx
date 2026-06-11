interface DashboardStatsProps {
  activeCount: number;
  totalCount: number;
  liveCalls: number;
  totalVendors: number;
  totalQuotes: number;
}

export function DashboardStats({
  activeCount,
  totalCount,
  liveCalls,
  totalVendors,
  totalQuotes,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-7">
      <div className="card stat">
        <div className="stat-label">Active RFQs</div>
        <div className="stat-value">{activeCount}</div>
        <div className="stat-delta muted">of {totalCount} total</div>
      </div>
      <div className="card stat">
        <div className="stat-label">Live calls</div>
        <div className="text-[var(--warn)] flex items-center gap-2 stat-value">
          {liveCalls}
          <span className="pulse-dot" />
        </div>
        <div className="stat-delta muted">parallel outreach</div>
      </div>
      <div className="card stat">
        <div className="stat-label">Vendors contacted</div>
        <div className="stat-value">{totalVendors}</div>
        <div className="stat-delta muted">across all campaigns</div>
      </div>
      <div className="card stat">
        <div className="stat-label">Quotes received</div>
        <div className="text-[var(--pos)] stat-value">{totalQuotes}</div>
        <div className="stat-delta muted">6 awaiting your review</div>
      </div>
    </div>
  );
}
