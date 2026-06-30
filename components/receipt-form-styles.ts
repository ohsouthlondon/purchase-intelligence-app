/**
 * Shared Tailwind class strings for the receipt review surfaces.
 *
 * Extracted so the header form and the line-item editor share one source of
 * truth for input, label, error, and badge styling — keeping the visual design
 * and typography scale identical across both without copy-paste drift.
 */

export const fieldClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs outline-none transition-colors placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/30 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500";

export const labelClass =
  "text-sm font-medium text-neutral-700 dark:text-neutral-300";

export const errorClass = "text-xs text-red-600 dark:text-red-400";

export const badgeClass =
  "rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-medium tracking-wide text-neutral-500 uppercase dark:border-neutral-700 dark:text-neutral-400";
