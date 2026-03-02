import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// Simple text-to-markdown/HTML rendering
function formatTextAsHTML(text: string) {
  return text.split('\n\n').map((paragraph, i) => (
    <p key={i} className="mb-4 text-slate-700 leading-relaxed text-sm md:text-base">
      {paragraph}
    </p>
  ));
}

export default async function RiskManagementPage() {
  const filePath = path.join(process.cwd(), 'docs', 'Risk_Management.txt');
  let content = "Content not found.";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-accent uppercase tracking-wider mb-6 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base mr-2">arrow_back</span>
            Back to Home
          </Link>
          <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-primary tracking-tight mb-4">
            Risk Management
          </h1>
          <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
        </div>
        <div className="prose max-w-none">
          {formatTextAsHTML(content)}
        </div>
      </div>
    </div>
  );
}
