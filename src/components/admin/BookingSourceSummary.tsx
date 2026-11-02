export type ChannelCount = {
  channel: string;
  days30: number;
  days90: number;
};

export function BookingSourceSummary({ rows }: { rows: ChannelCount[] }) {
  const total90 = rows.reduce((sum, row) => sum + row.days90, 0);

  return (
    <section className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl p-5 shadow-sm text-left">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-semibold text-base text-[var(--ink)]">Where bookings come from</h2>
          <p className="text-[11px] text-[var(--ink-soft)] mt-0.5">
            First website or ad that brought them in, counted from the day the booking was created.
            Earlier bookings show as Not recorded.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
          {total90} in the last 90 days
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--ink-soft)] italic">
          No bookings in the last 90 days yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
                <th className="text-left font-bold pb-2">Channel</th>
                <th className="text-right font-bold pb-2 w-24">30 days</th>
                <th className="text-right font-bold pb-2 w-24">90 days</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.channel} className="border-t border-[var(--border-color)]">
                  <td className="py-2 text-[var(--ink)]">{row.channel}</td>
                  <td className="py-2 text-right font-semibold text-[var(--ink)]">{row.days30}</td>
                  <td className="py-2 text-right font-semibold text-[#c8a86b]">{row.days90}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
