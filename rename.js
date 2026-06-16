const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Antigravity Finance') || content.includes('Antigravity')) {
        content = content.replace(/Antigravity Finance/g, 'Tallymate');
        content = content.replace(/Antigravity/g, 'Tallymate');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceInDir(path.join(process.cwd(), 'src/app/(dashboard)'));
