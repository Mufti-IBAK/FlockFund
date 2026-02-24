export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 bg-slate-200 rounded-lg w-48 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-72" />
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 mb-3" />
            <div className="h-6 bg-slate-200 rounded w-20 mb-1" />
            <div className="h-3 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-32" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-5 py-4 border-b border-slate-50">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-40 mb-1" />
              <div className="h-3 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-4 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-slate-200/80 p-5">
      <div className="w-10 h-10 rounded-xl bg-slate-100 mb-3" />
      <div className="h-6 bg-slate-200 rounded w-20 mb-1" />
      <div className="h-3 bg-slate-100 rounded w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="h-4 bg-slate-200 rounded w-32" />
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 px-5 py-4 border-b border-slate-50 last:border-0">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-40 mb-1" />
            <div className="h-3 bg-slate-100 rounded w-24" />
          </div>
          <div className="h-4 bg-slate-100 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-slate-200/80 p-6">
      <div className="h-4 bg-slate-200 rounded w-40 mb-4" />
      <div className="flex items-end gap-2 h-32">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex-1 bg-slate-100 rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-slate-200 rounded w-20 mb-2" />
          <div className="h-11 bg-slate-100 rounded-xl" />
        </div>
      ))}
      <div className="h-12 bg-slate-200 rounded-xl w-40" />
    </div>
  );
}

export function GlobeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 bg-slate-200 rounded-lg w-36 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-64 mb-6" />
      <div className="bg-slate-100 rounded-3xl" style={{ height: '500px' }} />
    </div>
  );
}
