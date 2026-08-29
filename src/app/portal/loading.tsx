export default function PortalLoading() {
  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 font-sans p-6 space-y-6 overflow-hidden animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between gap-4 shrink-0 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-[8px]" />
          <div className="h-3.5 w-72 bg-slate-100 dark:bg-slate-850 rounded-[6px]" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-[8px]" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-[12px] border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
          >
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded-[4px]" />
            <div className="h-7 w-16 bg-slate-300 dark:bg-slate-600 rounded-[6px]" />
          </div>
        ))}
      </div>

      {/* Main Content Grid / Table Skeleton */}
      <div className="flex-1 rounded-[12px] border border-slate-200/80 dark:border-slate-800 p-5 space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded-[4px]" />
        <div className="space-y-2.5 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-[8px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
