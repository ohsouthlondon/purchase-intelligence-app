import { Card } from "@/components/ui/card";
import { getMonthlySpend } from "@/lib/dashboard/queries";
import { getDb } from "@/lib/db";
import { toAmountString } from "@/lib/domain/money";

// Reads the database on demand; never prerender (or touch the DB) at build time.
export const dynamic = "force-dynamic";

const WINDOW_MONTHS = 12;

export default async function DashboardPage() {
  const rows = await getMonthlySpend(getDb(), { months: WINDOW_MONTHS });

  const totalPence = rows.reduce((sum, row) => sum + row.totalPence, 0);
  const purchaseCount = rows.reduce((sum, row) => sum + row.purchaseCount, 0);
  const hasSpend = rows.some(
    (row) => row.totalPence > 0 || row.purchaseCount > 0,
  );

  // Oldest → newest for the sparkline; bars are scaled to the busiest month.
  const chrono = [...rows].reverse();
  const maxPence = Math.max(1, ...rows.map((row) => row.totalPence));

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted text-sm">
          Monthly spend across the last {WINDOW_MONTHS} months.
        </p>
      </div>

      {hasSpend ? (
        <>
          <Card className="rise p-5">
            <p className="text-muted text-xs font-medium tracking-wide uppercase">
              Last 12 months
            </p>
            <p className="text-fg mt-1 text-3xl font-bold tracking-tight tabular-nums">
              £{toAmountString(totalPence / 100)}
            </p>
            <p className="text-muted mt-0.5 text-xs">
              {purchaseCount} {purchaseCount === 1 ? "purchase" : "purchases"}
            </p>

            <div className="mt-4 flex h-12 items-end gap-1" aria-hidden="true">
              {chrono.map((row, index) => {
                const pct = row.totalPence
                  ? Math.max(6, Math.round((row.totalPence / maxPence) * 100))
                  : 3;
                const isLatest = index === chrono.length - 1;
                return (
                  <div
                    key={row.month}
                    className={`bg-primary flex-1 rounded-t ${
                      isLatest ? "" : "opacity-35"
                    }`}
                    style={{ height: `${pct}%` }}
                  />
                );
              })}
            </div>
          </Card>

          <Card className="rise overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border text-muted border-b text-left text-xs font-medium tracking-wide uppercase">
                  <th className="px-4 py-2.5 font-medium">Month</th>
                  <th className="px-4 py-2.5 text-right font-medium">Spend</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Purchases
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {rows.map((row) => (
                  <tr key={row.month}>
                    <td className="text-fg px-4 py-2.5">{row.label}</td>
                    <td className="text-fg px-4 py-2.5 text-right font-semibold tabular-nums">
                      £{row.total}
                    </td>
                    <td className="text-muted px-4 py-2.5 text-right tabular-nums">
                      {row.purchaseCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <Card className="rise p-8 text-center">
          <p className="text-fg text-sm font-semibold">No spend recorded yet</p>
          <p className="text-muted mx-auto mt-1 max-w-xs text-sm">
            Add a manual entry or review a receipt and your monthly totals will
            appear here.
          </p>
        </Card>
      )}
    </section>
  );
}
