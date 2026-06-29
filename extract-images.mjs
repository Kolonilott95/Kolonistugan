// Återställer bilder från git-historikens inbäddade base64
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));

const result = spawnSync('git', ['show', 'HEAD:index.html'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});

if (result.error || result.status !== 0) {
  console.error('Git-fel:', result.stderr || result.error);
  process.exit(1);
}

const lines = result.stdout.split(/\r?\n/);
let jsonLine = lines[109].trim();
if (jsonLine.endsWith(';')) jsonLine = jsonLine.slice(0, -1);

const entries = JSON.parse(jsonLine);
const bilderDir = path.join(root, 'bilder');
fs.mkdirSync(bilderDir, { recursive: true });

for (const entry of entries) {
  const entryDir = path.join(bilderDir, entry.date);
  fs.mkdirSync(entryDir, { recursive: true });

  entry.images = (entry.images || []).map((src, i) => {
    const m = src.match(/^data:(image\/\w+);base64,(.+)$/s);
    if (!m) return src;
    const ext = m[1] === 'image/png' ? 'png' : 'jpg';
    const filename = `${String(i + 1).padStart(2, '0')}.${ext}`;
    fs.writeFileSync(path.join(entryDir, filename), Buffer.from(m[2], 'base64'));
    return `bilder/${entry.date}/${filename}`;
  });
}

entries.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

fs.writeFileSync(
  path.join(root, 'data.js'),
  `// Byggdagbok – inlägg och bildsökvägar\nconst entries = ${JSON.stringify(entries, null, 2)};\n`
);

for (const e of entries) {
  console.log(`${e.date} – ${e.title} (${e.images.length} bilder)`);
}
