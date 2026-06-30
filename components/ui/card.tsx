import type { ReactNode } from "react";

/**
 * Surface primitive for the 2026-06-30 design refresh.
 *
 * A rounded card with the shared depth treatment: a faint vertical surface tint
 * (luminous, not flat), the soft shadow + inner top highlight via the
 * `shadow-soft` token, and a hairline border. No blur. Pass `className` for
 * padding/layout.
 */
interface CardProps {
  children: ReactNode;
  className?: string;
}

const SURFACE_TINT = {
  backgroundImage:
    "linear-gradient(180deg, var(--surface-tint), var(--surface))",
} as const;

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      style={SURFACE_TINT}
      className={`border-border shadow-soft rounded-2xl border ${className}`}
    >
      {children}
    </div>
  );
}
