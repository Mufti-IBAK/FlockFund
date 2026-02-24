import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] p-6">
      <div className="text-center max-w-md">
        <p className="font-mono text-8xl font-bold text-[#d4a843]/20 mb-4">
          404
        </p>
        <h1 className="font-heading text-2xl font-extrabold text-[#0f2e23] mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-[#0f2e23] text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-slate-100 text-[#0f2e23] rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
