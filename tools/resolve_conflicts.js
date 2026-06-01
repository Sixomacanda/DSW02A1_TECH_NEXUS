const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const files = walk(root);
const fixed = [];
for (const f of files) {
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  if (!text.includes('', start);
    const end = text.indexOf('', mid);
    if (start === -1 || mid === -1 || end === -1) break;
    const theirs = text.substring(mid + '======='.length, end);
    text = text.substring(0, start) + theirs + text.substring(end + ('>>>>>>>'.length));
    changed = true;
  }
  if (text !== orig) {
    try {
      fs.copyFileSync(f, f + '.orig');
    } catch (e) {}
    fs.writeFileSync(f, text, 'utf8');
    fixed.push(path.relative(root, f));
  }
}

if (fixed.length) {
  console.log('Fixed files:');
  fixed.forEach(f => console.log(f));
} else {
  console.log('No conflict markers found.');
}
