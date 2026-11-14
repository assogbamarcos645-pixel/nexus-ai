// scripts/render-icons.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.resolve(projectRoot, 'public');

const edgeCandidates = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

const browserExe = edgeCandidates.find((p) => fs.existsSync(p));
if (!browserExe) {
  console.error('Aucun navigateur Chromium (Edge/Chrome) trouvé.');
  process.exit(1);
}
console.log('Utilisation du navigateur :', browserExe);

// Fonction de rendu d'un SVG en PNG via navigateur headless
function renderSvgToPng(svgPath, outputPngPath, width, height) {
  // Créons une page HTML minimale servant le SVG en plein écran
  const tempHtmlPath = path.join(publicDir, `_temp_${width}x${height}.html`);
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${width}px; height: ${height}px; overflow: hidden; background: transparent; }
    svg { display: block; width: ${width}px; height: ${height}px; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

  fs.writeFileSync(tempHtmlPath, html);
  const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

  const args = [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${width},${height}`,
    `--screenshot=${outputPngPath}`,
    fileUrl
  ];

  const res = spawnSync(browserExe, args, { stdio: 'pipe', timeout: 15000 });
  try {
    fs.unlinkSync(tempHtmlPath);
  } catch {}

  if (fs.existsSync(outputPngPath)) {
    const stats = fs.statSync(outputPngPath);
    console.log(`✓ Rendu réussi : ${path.basename(outputPngPath)} (${width}x${height}, ${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`✗ Échec du rendu de ${outputPngPath}`, res.stderr?.toString());
  }
}

// 1. Android Maskable Icons (512x512 et 192x192)
const maskableSvg = path.join(publicDir, 'icon-maskable.svg');
renderSvgToPng(maskableSvg, path.join(publicDir, 'icon-maskable-512x512.png'), 512, 512);
renderSvgToPng(maskableSvg, path.join(publicDir, 'icon-maskable-192x192.png'), 192, 192);

// 2. Standard Any Icons (512x512 et 192x192)
const anySvg = path.join(publicDir, 'icon-any.svg');
renderSvgToPng(anySvg, path.join(publicDir, 'icon-512x512.png'), 512, 512);
renderSvgToPng(anySvg, path.join(publicDir, 'icon-192x192.png'), 192, 192);

// 3. Apple Touch Icon (180x180)
const appleSvg = path.join(publicDir, 'icon-apple.svg');
renderSvgToPng(appleSvg, path.join(publicDir, 'apple-touch-icon.png'), 180, 180);

console.log('\nToutes les icônes PWA haute définition ont été générées avec succès !');
