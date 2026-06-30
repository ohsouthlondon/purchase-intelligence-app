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

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Monthly spend across the last {WINDOW_MONTHS} months.
        </p>
      </div>

      {hasSpend ? (
        <>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              £{toAmountString(totalPence / 100)}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {purchaseCount} {purchaseCount === 1 ? "purchase" : "purchases"}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs font-medium tracking-wide text-neutral-400 uppercase dark:border-neutral-800 dark:text-neutral-500">
                  <th className="px-4 py-2.5 font-medium">Month</th>
                  <th className="px-4 py-2.5 text-right font-medium">Spend</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Purchases
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {rows.map((row) => (
                  <tr key={row.month}>
                    <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                      {row.label}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      £{row.total}
                    </td>
                    <td className="px-4 py-2.5 text-right text-neutral-500 tabular-nums dark:text-neutral-400">
                      {row.purchaseCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            No spend recorded yet
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Add a manual entry or review a receipt and your monthly totals will
            appear here.
          </p>
        </div>
      )}
    </section>
  );
}
