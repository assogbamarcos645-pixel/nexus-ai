// scripts/generate-identical-icons.js
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
  console.error('Chromium introuvable');
  process.exit(1);
}

// Nous allons créer les versions exactes de l'icône iOS (le N 3D) pour Android :
// 1. icon-maskable-512x512.png : le N 3D sur fond opaque noir/cyber (#0b0f19), calibré avec une marge de 12% pour que le masque Android (cercle/squircle) ne coupe rien et ne mette aucun cercle blanc.
// 2. icon-maskable-192x192.png : même chose en 192x192.
// 3. icon-512x512.png : le N 3D plein champ (identique iOS).
// 4. icon-192x192.png : le N 3D plein champ 192x192.
// 5. apple-touch-icon.png : le N 3D plein champ 180x180.

function renderHtmlToPng(htmlContent, outputPngPath, width, height) {
  const tempHtmlPath = path.join(publicDir, `_temp_${width}x${height}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent);
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

  spawnSync(browserExe, args, { stdio: 'pipe', timeout: 15000 });
  try {
    fs.unlinkSync(tempHtmlPath);
  } catch {}

  const stats = fs.statSync(outputPngPath);
  console.log(`✓ ${path.basename(outputPngPath)} généré (${width}x${height}, ${(stats.size / 1024).toFixed(1)} KB)`);
}

const logoUrl = 'file:///' + path.join(publicDir, 'nexus-logo-clean.png').replace(/\\/g, '/');

// 1. Android Maskable 512x512 (fond noir opaque, logo N 3D centré avec safe-zone de 78% pour ne rien tronquer)
const maskableHtml512 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 512px;
      height: 512px;
      overflow: hidden;
      background: #000000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img {
      width: 410px;
      height: 410px;
      object-fit: contain;
      filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.7));
    }
  </style>
</head>
<body>
  <img src="${logoUrl}">
</body>
</html>`;

// 2. Android Maskable 192x192
const maskableHtml192 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 192px;
      height: 192px;
      overflow: hidden;
      background: #000000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img {
      width: 154px;
      height: 154px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="${logoUrl}">
</body>
</html>`;

// 3. Any / Plein Champ 512x512 (fond noir opaque, logo N 3D à 96% de la taille, identique à iOS)
const anyHtml512 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 512px;
      height: 512px;
      overflow: hidden;
      background: #000000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img {
      width: 512px;
      height: 512px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="${logoUrl}">
</body>
</html>`;

// 4. Any / Plein Champ 192x192
const anyHtml192 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 192px;
      height: 192px;
      overflow: hidden;
      background: #000000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img {
      width: 192px;
      height: 192px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="${logoUrl}">
</body>
</html>`;

// 5. Apple Touch Icon 180x180 (exactement identique)
const appleHtml180 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 180px;
      height: 180px;
      overflow: hidden;
      background: #000000;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img {
      width: 180px;
      height: 180px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <img src="${logoUrl}">
</body>
</html>`;

renderHtmlToPng(maskableHtml512, path.join(publicDir, 'icon-maskable-512x512.png'), 512, 512);
renderHtmlToPng(maskableHtml192, path.join(publicDir, 'icon-maskable-192x192.png'), 192, 192);
renderHtmlToPng(anyHtml512, path.join(publicDir, 'icon-512x512.png'), 512, 512);
renderHtmlToPng(anyHtml192, path.join(publicDir, 'icon-192x192.png'), 192, 192);
renderHtmlToPng(appleHtml180, path.join(publicDir, 'apple-touch-icon.png'), 180, 180);

console.log('✓ Rendu des icônes unifiées terminé !');
