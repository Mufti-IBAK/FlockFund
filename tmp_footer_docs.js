const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');
const pagesDir = path.join(__dirname, 'src', 'app');
const homePageFile = path.join(__dirname, 'src', 'app', 'page.tsx');

// List files in docs
let docsFiles = fs.existsSync(docsDir) ? fs.readdirSync(docsDir) : [];
docsFiles = docsFiles.filter(f => f.endsWith('.txt'));

let homePageContent = fs.readFileSync(homePageFile, 'utf8');

const footerLinksPattern = /<Link\s+href="\/about#([^"]+)"\s+className="([^"]+)">\s*([^<]+)\s*<\/Link>/g;

// Create matching mapping: lowercased footer label -> exactly matching .txt doc
const availableDocs = new Map();
docsFiles.forEach(f => {
  const baseName = path.basename(f, '.txt').toLowerCase().replace(/_/g, ' ');
  availableDocs.set(baseName, f);
});

let updatedHomePage = homePageContent;
let changed = false;

let match;
while ((match = footerLinksPattern.exec(homePageContent)) !== null) {
  const [fullMatch, hashLink, classes, label] = match;
  
  const labelNormalized = label.toLowerCase().trim();
  
  // Also check if any file in docs directly matches the label exactly ignoring case
  let matchingDoc = null;
  docsFiles.forEach(f => {
     if (f.toLowerCase() === `${labelNormalized}.txt` || f.toLowerCase() === `${hashLink.toLowerCase()}.txt`) {
         matchingDoc = f;
     }
  });

  if (matchingDoc) {
    const slug = matchingDoc.replace('.txt', '').toLowerCase();
    
    // Create page
    const pageFolder = path.join(pagesDir, slug);
    if (!fs.existsSync(pageFolder)) {
      fs.mkdirSync(pageFolder, { recursive: true });
    }
    
    const pageContent = `import fs from 'fs';
import path from 'path';
import Link from 'next/link';

function formatTextAsHTML(text: string) {
  return text.split('\\n\\n').map((paragraph, i) => (
    <p key={i} className="mb-4 text-slate-700 leading-relaxed text-sm md:text-base">
      {paragraph}
    </p>
  ));
}

export default async function DocPage() {
  const filePath = path.join(process.cwd(), 'docs', '${matchingDoc}');
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
          <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-primary tracking-tight mb-4 capitalize">
            ${label}
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
`;
    fs.writeFileSync(path.join(pageFolder, 'page.tsx'), pageContent);
    console.log(`Generated page for ${matchingDoc} at /${slug}`);
    
    // Update footer link
    const newLink = `<Link
                    href="/${slug}"
                    className="${classes}"
                  >
                    ${label}
                  </Link>`;
    updatedHomePage = updatedHomePage.replace(fullMatch, newLink);
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(homePageFile, updatedHomePage);
  console.log('Updated homepage footer links to point to new pages.');
} else {
  console.log('No matching docs found for footer links.');
}
