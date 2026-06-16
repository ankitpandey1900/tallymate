export function PageSkeleton({ title = "Loading" }: { title?: string }) {
  return (
    <div className="space-y-6 animate-pulse pb-20 md:pb-0">
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-64 rounded-md bg-neutral-100 dark:bg-neutral-900" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel-card p-5 h-24 bg-neutral-100/80 dark:bg-neutral-900/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel-card p-5 lg:col-span-2 h-72 bg-neutral-100/80 dark:bg-neutral-900/50" />
        <div className="panel-card p-5 h-72 bg-neutral-100/80 dark:bg-neutral-900/50" />
      </div>
      <p className="text-center text-[11px] text-neutral-400">{title}…</p>
    </div>
  );
}
