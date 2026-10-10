export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col items-center justify-center p-8 font-sans">
      <main className="max-w-xl w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            Phase 1 Foundation
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Internal Preview
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mb-2">
          Receipts
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
          Evidence-backed agreement and scope tracker for freelancers and small agencies.
        </p>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium mb-1">Status: Product workflow not implemented yet</p>
          <p className="text-amber-800 dark:text-amber-300">
            The foundation setup is complete. Agreement extraction, classifier verification, evaluation harness, and interactive panels will be implemented following model evaluation and architectural sign-off.
          </p>
        </div>
      </main>
    </div>
  );
}
