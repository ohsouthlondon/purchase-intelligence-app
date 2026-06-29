interface PlaceholderScreenProps {
  title: string;
  description: string;
  /** Optional note about when this screen gets real functionality. */
  milestone?: string;
}

/**
 * Shared body for app-shell placeholder routes. Keeps each route page tiny
 * and consistent until its real content is built in a later slice/milestone.
 */
export function PlaceholderScreen({
  title,
  description,
  milestone,
}: PlaceholderScreenProps) {
  return (
    <section className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
      {milestone ? (
        <p className="text-xs font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
          {milestone}
        </p>
      ) : null}
    </section>
  );
}
