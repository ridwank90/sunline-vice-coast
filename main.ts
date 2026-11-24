// A working gta6-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. Only the plumbing, not an open world: Block
// Dodger, a plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a
// title screen, score, lives and levels, game over and restart, flat colours and no sound. Build
// your own open-world crime game in its place (three.js or any library you vendor under game/),
// put your 3 or 4 PNG or JPEG screenshots in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, lstatSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const game = join(here, 'game');
const screenshots = join(here, 'screenshots');

function imageSize(bytes: Uint8Array): [number, number] | undefined {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    if (bytes.length < 24 || String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') return;
    return [((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0,
      ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0];
  }
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) return;
  const frames = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  for (let i = 2; i + 9 < bytes.length;) {
    if (bytes[i++] !== 0xff) continue;
    while (bytes[i] === 0xff) i++;
    const marker = bytes[i++];
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (i + 1 >= bytes.length) return;
    const length = (bytes[i] << 8) | bytes[i + 1];
    if (length < 2 || i + length > bytes.length) return;
    if (frames.has(marker)) return [(bytes[i + 5] << 8) | bytes[i + 6], (bytes[i + 3] << 8) | bytes[i + 4]];
    i += length;
  }
}

// Catch an incomplete hand-in before copying anything to the grader's output.
if (!existsSync(join(game, 'index.html'))) throw new Error('game/index.html is required');
const shots = existsSync(screenshots)
  ? readdirSync(screenshots).filter((name) => !name.startsWith('.')).sort()
  : [];
if (shots.length < 3 || shots.length > 4) throw new Error('screenshots/ must contain three or four images');
for (const name of shots) {
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(name) || name.startsWith('-')) throw new Error(`invalid screenshot name: ${name}`);
  const path = join(screenshots, name);
  const stat = statSync(path);
  if (!stat.isFile() || stat.size > 262144) throw new Error(`invalid screenshot file or size: ${name}`);
  const bytes = readFileSync(path);
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!jpeg && !png) throw new Error(`screenshot must be PNG or JPEG: ${name}`);
  const size = imageSize(bytes);
  if (!size || Math.max(...size) > 1280 || Math.min(...size) < 480) throw new Error(`invalid screenshot dimensions or framing: ${name}`);
}

let gameFiles = 0;
let gameBytes = 0;
function inspectGame(path: string): void {
  for (const entry of readdirSync(path)) {
    const child = join(path, entry);
    const stat = lstatSync(child);
    if (stat.isSymbolicLink()) throw new Error(`game/ cannot contain symlinks: ${child}`);
    gameFiles++;
    if (gameFiles > 993) throw new Error('game/ exceeds the 993 file and directory limit');
    if (stat.isDirectory()) inspectGame(child);
    else if (stat.isFile()) {
      gameBytes += stat.size;
      if (gameBytes > 50331648) throw new Error('game/ exceeds the 48 MiB size limit');
      if (Buffer.byteLength(child.slice(game.length + 1)) > 1000) throw new Error(`game path exceeds 1,000 bytes: ${child}`);
    } else throw new Error(`game/ contains a non-file entry: ${child}`);
  }
}
inspectGame(game);

mkdirSync(out, { recursive: true });
cpSync(game, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(screenshots, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
