import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      {description ? (
        <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
