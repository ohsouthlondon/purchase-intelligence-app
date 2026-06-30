import { Card } from "@/components/ui/card";

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
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted text-sm">{description}</p>
      </div>
      {milestone ? (
        <Card className="rise p-4">
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            {milestone}
          </p>
        </Card>
      ) : null}
    </section>
  );
}
