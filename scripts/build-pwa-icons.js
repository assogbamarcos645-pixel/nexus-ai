// scripts/build-pwa-icons.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.resolve(projectRoot, 'public');

// Lire le contenu de favicon.svg
const rawSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf8');

// Extraire <defs>...</defs> et le contenu des éléments graphiques
const defsMatch = rawSvg.match(/<defs>([\s\S]*?)<\/defs>/);
const defsContent = defsMatch ? defsMatch[1] : '';

// Extraire le corps SVG (sans les balises <svg>, <defs> et sans le texte s'il y en a)
let bodyContent = rawSvg
  .replace(/<svg[\s\S]*?>/, '')
  .replace(/<\/svg>/, '')
  .replace(/<defs>[\s\S]*?<\/defs>/, '')
  // On retire le micro-texte "NEXUS-X // QUANTUM-CORE" pour que l'emblème soit ultra net et épuré sur mobile
  .replace(/<text[\s\S]*?<\/text>/g, '');

// 1. Template SVG Maskable (Android Adaptive Icon)
// - Toile 512x512 avec fond 100% plein (plein champ, zéro transparence)
// - Dégradé radial signature cyber-sombre
// - Emblème centré à l'échelle 3.3 (330x330), parfaitement dans la Safe Zone Android (80% / rayon 40%)
const maskableSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${defsContent}
    <radialGradient id="android-bg-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1d4ed8" stop-opacity="0.35" />
      <stop offset="35%" stop-color="#2563eb" stop-opacity="0.20" />
      <stop offset="65%" stop-color="#0f172a" stop-opacity="0.60" />
      <stop offset="100%" stop-color="#070a12" stop-opacity="1" />
    </radialGradient>
    <radialGradient id="android-subtle-core" cx="50%" cy="50%" r="28%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Fond plein sans aucune transparence (obligatoire pour Android Maskable) -->
  <rect width="512" height="512" fill="#070a12" />
  <rect width="512" height="512" fill="url(#android-bg-glow)" />
  <circle cx="256" cy="256" r="160" fill="url(#android-subtle-core)" />

  <!-- Anneau subtil marquant l'aura du Quantum Core -->
  <circle cx="256" cy="256" r="185" stroke="#38bdf8" stroke-width="1.2" stroke-opacity="0.18" stroke-dasharray="4 6" />

  <!-- Emblème Quantum-X centré dans la zone de sécurité (64% du diamètre, zone safe = 80%) -->
  <g transform="translate(256, 256) scale(3.3) translate(-50, -50)">
    ${bodyContent}
  </g>
</svg>`;

// 2. Template SVG Standard (Purpose: Any / Splash / Desktop)
const anySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 512 512" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${defsContent}
    <radialGradient id="pwa-bg-glow" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#1e40af" stop-opacity="0.4" />
      <stop offset="45%" stop-color="#1d4ed8" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#0b0f19" stop-opacity="0.95" />
    </radialGradient>
    <linearGradient id="pwa-border" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6" />
      <stop offset="50%" stop-color="#2563eb" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.5" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="112" fill="#0b0f19" />
  <rect width="512" height="512" rx="112" fill="url(#pwa-bg-glow)" />
  <rect x="2" y="2" width="508" height="508" rx="110" stroke="url(#pwa-border)" stroke-width="3" fill="none" />

  <g transform="translate(256, 256) scale(3.8) translate(-50, -50)">
    ${bodyContent}
  </g>
</svg>`;

// 3. Template SVG pour Apple Touch Icon (180x180)
const appleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 180 180" width="180" height="180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${defsContent}
    <radialGradient id="apple-bg-glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1e40af" stop-opacity="0.45" />
      <stop offset="50%" stop-color="#1d4ed8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#080c16" stop-opacity="1" />
    </radialGradient>
  </defs>

  <!-- Fond plein sombre (iOS arrondit automatiquement les coins) -->
  <rect width="180" height="180" fill="#080c16" />
  <rect width="180" height="180" fill="url(#apple-bg-glow)" />

  <g transform="translate(90, 90) scale(1.36) translate(-50, -50)">
    ${bodyContent}
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg);
fs.writeFileSync(path.join(publicDir, 'icon-any.svg'), anySvg);
fs.writeFileSync(path.join(publicDir, 'icon-apple.svg'), appleSvg);

console.log('✓ Fichiers SVG sources générés dans public/');
