const fs = require("fs");
const path = require("path");

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir(
  "c:/Users/Mufti_Ibn_Al_Khattab/Desktop/lib/code/FlockFund_II/src/app",
  function (filePath) {
    if (filePath.endsWith(".tsx")) {
      let content = fs.readFileSync(filePath, "utf8");

      // Check if it has the divide-y pattern that needs wrapping
      if (content.includes('className="divide-y divide-slate-50"')) {
        let originalContent = content;

        // We'll use a regex to find <div className="divide-y divide-slate-50">
        // and replace it with <div className="overflow-x-auto">\n<div className="divide-y divide-slate-50 min-w-[800px] md:min-w-0">
        content = content.replace(
          /<div className="divide-y divide-slate-50">/g,
          '<div className="overflow-x-auto">\n          <div className="divide-y divide-slate-50 min-w-[800px] xl:min-w-0">',
        );

        // Then we need to add a closing </div> for the overflow-x-auto wrapper.
        // Usually it ends with:
        //           </div>
        //         )}
        // We can replace that with:
        //           </div>
        //         </div>
        //         )}
        // Let's use a regex to match the end of the divide-y div based on the typical indentation and the closing bracket of the ternary.
        content = content.replace(
          /(\s+)<\/div>\n(\s+)\)}/g,
          "$1</div>\n$1</div>\n$2)}",
        );

        // We also need to fix hidden md:grid to just grid, and md:grid-cols-7 to grid-cols-7 for these tables so they stay horizontal on mobile and don't stack if we're enforcing horizontal scrolling.
        // E.g. className="hidden md:grid grid-cols-7" -> className="grid grid-cols-7"
        content = content.replace(/hidden md:grid/g, "grid");
        content = content.replace(/md:grid-cols-/g, "grid-cols-");
        content = content.replace(/grid-cols-2 lg:grid-cols-/g, "grid-cols-");
        content = content.replace(/col-span-2 md:col-span-1/g, "col-span-1");

        if (originalContent !== content) {
          fs.writeFileSync(filePath, content);
          console.log(`Updated ${filePath}`);
        }
      }
    }
  },
);
