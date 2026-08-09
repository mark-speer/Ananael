import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GOETIA_SPIRITS } from '../src/data/arsGoetia';
import { goetiaSealSvgDocument } from '../src/lib/goetiaSealArt';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'public', 'assets', 'Images', 'Goetia');
mkdirSync(dir, { recursive: true });
for (const s of GOETIA_SPIRITS) {
  writeFileSync(join(dir, `${s.sealRef}.svg`), goetiaSealSvgDocument(s), 'utf8');
}
console.log(`wrote ${GOETIA_SPIRITS.length} seals to ${dir}`);
