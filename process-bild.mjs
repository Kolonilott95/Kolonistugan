// Minskar och sparar bilder med datum i filnamnet
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @param {string} src @param {string} destDir */
export async function processBild(src, destDir) {
  const base = path.basename(src, path.extname(src));
  // IMG_20260628_155608799 -> 2026-06-28_155608
  const m = base.match(/^IMG_(\d{4})(\d{2})(\d{2})_(\d{6})/);
  const name = m
    ? `${m[1]}-${m[2]}-${m[3]}_${m[4]}.jpg`
    : `${path.basename(destDir)}_${Date.now()}.jpg`;

  fs.mkdirSync(destDir, { recursive: true });
  const out = path.join(destDir, name);

  await sharp(src)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(out);

  return `bilder/${path.basename(destDir)}/${name}`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [src, destDir] = process.argv.slice(2);
  if (!src || !destDir) {
    console.error('Användning: node process-bild.mjs <src> <destDir>');
    process.exit(1);
  }
  const rel = await processBild(src, destDir);
  console.log(rel, fs.statSync(path.join(root, rel)).size);
}
