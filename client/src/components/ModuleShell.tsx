interface ModuleShellProps {
  title: string;
  description: string;
}

/**
 * Placeholder for unfinished roadmap modules.
 * Navigable from the sidebar; Soon badge remains until Done-when criteria are met.
 */
export default function ModuleShell({ title, description }: ModuleShellProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ananael-gold">{title}</h1>
          <span className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
            Soon
          </span>
        </div>
        <p className="max-w-2xl text-sm text-ananael-muted">{description}</p>
      </header>

      <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-8">
        <p className="text-sm text-zinc-400">
          This chamber is prepared but not yet furnished. Check the roadmap for when
          full workings arrive.
        </p>
      </div>
    </div>
  );
}
