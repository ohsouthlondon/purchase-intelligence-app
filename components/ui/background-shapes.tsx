/**
 * Static, decorative background shapes (2026-06-30 design refresh).
 *
 * Three large, low-opacity radial blobs that sit behind all content to create
 * soft luminous depth and overlap. Intentionally subtler than the card depth.
 * No blur filters and no animation — `radial-gradient` on a handful of fixed
 * elements is GPU-cheap, so mobile performance stays safe. Purely decorative,
 * so hidden from assistive tech.
 */
export function BackgroundShapes() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, var(--shape-teal), transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -left-28 h-80 w-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--shape-cyan), transparent 70%)",
        }}
      />
      <div
        className="absolute right-1/4 -bottom-28 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--shape-indigo), transparent 72%)",
        }}
      />
    </div>
  );
}
