/**
 * src/config/labTemplates.ts
 *
 * Modèles de projets officiels pour NEXUS LAB.
 * Comprend 5 environnements :
 *  1. Site HTML / CSS / JavaScript (aperçu navigateur interactif)
 *  2. Application React avec Vite (configuration moderne TypeScript)
 *  3. API Node.js REST (Express avec routes et middleware de logging)
 *  4. Projet PHP (architecture MVC avec routeur et PDO)
 *  5. Projet Python (FastAPI / analyse modulaire avec typage)
 */

import type { ProjectTemplate } from '@/types/lab';

export const LAB_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Projet Vierge (Vide)',
    description: 'Espace 100% vierge sans aucun code pré-écrit. Idéal pour vibe-coder avec NEXUS DEV ou écrire son code de zéro.',
    category: 'frontend',
    icon: 'Sparkles',
    badge: 'Vierge',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: '',
      },
    ],
  },
  {
    id: 'html-css-js',
    name: 'Site HTML/CSS/JavaScript',
    description: 'Interface web moderne et interactive avec graphiques en direct et design Cosmic Intelligence.',
    category: 'frontend',
    icon: 'Globe',
    badge: 'Aperçu direct',
    executionType: 'browser-iframe',
    defaultFiles: [
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CyberPulse Dashboard — NEXUS LAB</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">
        <h1>NEXUS CyberPulse</h1>
      </div>
      <div class="status-badge">
        <span class="status-dot"></span> Système actif
      </div>
    </header>

    <main class="grid">
      <section class="card glass">
        <h2>Métriques en direct</h2>
        <div class="stats-row">
          <div class="stat-box">
            <span class="stat-value" id="cpu-stat">42%</span>
            <span class="stat-label">Charge CPU</span>
          </div>
          <div class="stat-box">
            <span class="stat-value" id="mem-stat">1.8 Go</span>
            <span class="stat-label">Mémoire vive</span>
          </div>
          <div class="stat-box">
            <span class="stat-value" id="net-stat">128 ms</span>
            <span class="stat-label">Latence</span>
          </div>
        </div>
        <button id="btn-ping" class="btn primary">Envoyer une impulsion</button>
      </section>

      <section class="card glass">
        <h2>Oscillateur quantique</h2>
        <canvas id="canvas-wave" width="360" height="140"></canvas>
      </section>
    </main>

    <footer class="footer">
      <p>Exécuté dans l'environnement sécurisé et isolé de <strong>NEXUS LAB</strong>.</p>
    </footer>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        path: 'style.css',
        language: 'css',
        content: `:root {
  --bg: #070712;
  --surface: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.08);
  --primary: #7c0df4;
  --primary-light: #a855f7;
  --cyan: #06b6d4;
  --text: #e2e8f0;
  --text-dim: #94a3b8;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: radial-gradient(circle at 50% 0%, #150930 0%, var(--bg) 80%);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  padding: 24px 16px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 24px;
  background: var(--primary);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  box-shadow: 0 0 15px rgba(124, 13, 244, 0.5);
}

.header h1 {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #fff 30%, var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: var(--cyan);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.card {
  padding: 24px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  backdrop-filter: blur(12px);
}

.card h2 {
  font-size: 16px;
  color: var(--text-dim);
  margin-bottom: 18px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.stat-box {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-dim);
}

.btn {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(124, 13, 244, 0.4);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 13, 244, 0.6);
}

canvas {
  width: 100%;
  height: 120px;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 8px;
}

.footer {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: var(--text-dim);
}`,
      },
      {
        name: 'app.js',
        path: 'app.js',
        language: 'javascript',
        content: `// NEXUS LAB — Script interactif du projet CyberPulse
console.log('[CyberPulse] Initialisation du système...');

const cpuEl = document.getElementById('cpu-stat');
const memEl = document.getElementById('mem-stat');
const netEl = document.getElementById('net-stat');
const btnPing = document.getElementById('btn-ping');
const canvas = document.getElementById('canvas-wave');
const ctx = canvas.getContext('2d');

let tick = 0;
let baseFreq = 0.05;

// Animation d'onde sinusoïdale sur le Canvas
function drawWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#06b6d4';

  for (let x = 0; x < canvas.width; x++) {
    const y = canvas.height / 2 + Math.sin(x * baseFreq + tick) * 28 * Math.cos(x * 0.01);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Deuxième harmonique violette
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#a855f7';
  for (let x = 0; x < canvas.width; x++) {
    const y = canvas.height / 2 + Math.cos(x * (baseFreq * 0.8) - tick * 1.2) * 20;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  tick += 0.04;
  requestAnimationFrame(drawWave);
}

drawWave();

// Mise à jour des métriques simulées
setInterval(() => {
  const cpu = Math.floor(30 + Math.random() * 45);
  const mem = (1.5 + Math.random() * 0.6).toFixed(2);
  const net = Math.floor(80 + Math.random() * 80);

  if (cpuEl) cpuEl.textContent = cpu + '%';
  if (memEl) memEl.textContent = mem + ' Go';
  if (netEl) netEl.textContent = net + ' ms';
}, 2200);

// Interaction utilisateur
btnPing.addEventListener('click', () => {
  console.log('[CyberPulse] Impulsion énergétique déclenchée');
  baseFreq = 0.12;
  btnPing.textContent = 'Signal amplifié !';
  setTimeout(() => {
    baseFreq = 0.05;
    btnPing.textContent = 'Envoyer une impulsion';
  }, 1200);
});
`,
      },
    ],
  },
  {
    id: 'react-vite',
    name: 'Application React avec Vite',
    description: 'Structure complète React 19 + TypeScript exécutée in-browser avec Vite, Tailwind CSS et compilation sub-seconde.',
    category: 'frontend',
    icon: 'Atom',
    badge: 'React 19 + Vite HMR',
    executionType: 'browser-iframe',
    serverRequirements: {
      runtime: 'Node.js ≥ 18.0.0 (npm ≥ 9) ou Runtime In-Browser NEXUS LAB',
      dependencies: ['react@^19.0.0', 'react-dom@^19.0.0', 'vite@^6.0.0', 'typescript@^5.5.0'],
      installCommand: 'npm install',
      runCommand: 'npm run dev',
      port: 5173,
      notes: 'Ce projet s\'exécute directement dans le navigateur grâce au runtime Vite et aux WebContainers intégrés.',
    },
    defaultFiles: [
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: `{
  "name": "nexus-react-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^6.0.0"
  }
}`,
      },
      {
        name: 'vite.config.ts',
        path: 'vite.config.ts',
        language: 'typescript',
        content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration officielle du bundler Vite pour React
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});`,
      },
      {
        name: 'index.html',
        path: 'index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexus Reactor — React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      },
      {
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: `import { useState } from 'react';

export default function App() {
  const [energyLevel, setEnergyLevel] = useState<number>(75);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(true);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a14',
      color: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(124, 13, 244, 0.25)'
      }}>
        <h1 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>Réacteur Stellaire</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
          Application React 19 développée dans NEXUS LAB
        </p>

        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Niveau de puissance</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#22d3ee' }}>{energyLevel}%</div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setEnergyLevel(prev => Math.min(100, prev + 5))}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: '#7c0df4',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            + Booster
          </button>
          <button
            onClick={() => setIsShieldActive(prev => !prev)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: isShieldActive ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
              color: isShieldActive ? '#22d3ee' : '#94a3b8',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Bouclier: {isShieldActive ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}`,
      },
      {
        name: 'main.tsx',
        path: 'src/main.tsx',
        language: 'typescript',
        content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        content: `# Nexus Reactor — Application React & Vite

Ce projet a été configuré pour une exécution locale avec Node.js.

## Démarrage rapide

\`\`\`bash
# 1. Télécharger et décompresser l'archive exportée
# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement Vite
npm run dev
\`\`\`

L'application sera accessible sur **http://localhost:5173**.`,
      },
    ],
  },
  {
    id: 'node-api',
    name: 'API Node.js',
    description: 'API RESTful modulaire avec Express, journalisation middleware et testeur interactif in-browser.',
    category: 'backend',
    icon: 'Server',
    badge: 'Express API Live',
    executionType: 'browser-iframe',
    serverRequirements: {
      runtime: 'Node.js ≥ 18.0.0 (npm ≥ 9) ou Simulateur In-Browser NEXUS LAB',
      dependencies: ['express@^4.21.0', 'cors@^2.8.5', 'dotenv@^16.4.5'],
      installCommand: 'npm install',
      runCommand: 'npm start',
      port: 3000,
      notes: 'Ce projet s\'exécute et se teste directement dans le navigateur avec simulateur de requêtes HTTP temps réel.',
    },
    defaultFiles: [
      {
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: `{
  "name": "nexus-node-api",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  }
}`,
      },
      {
        name: 'server.js',
        path: 'server.js',
        language: 'javascript',
        content: `import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Logger de requêtes
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`[\${req.method}] \${req.originalUrl} -> \${res.statusCode} (\${duration}ms)\`);
  });
  next();
});

// Routes principales
app.get('/', (req, res) => {
  res.json({
    name: 'NEXUS Node API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

app.use('/api', apiRouter);

// Gestionnaire 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée', path: req.path });
});

app.listen(PORT, () => {
  console.log(\`Serveur NEXUS API en écoute sur http://localhost:\${PORT}\`);
});`,
      },
      {
        name: 'api.js',
        path: 'routes/api.js',
        language: 'javascript',
        content: `import { Router } from 'express';

export const apiRouter = Router();

// Endpoint de santé du service
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Endpoint de démonstration pour les agents
apiRouter.get('/agents', (req, res) => {
  res.json([
    { id: 'nexus', name: 'NEXUS Core', status: 'ready', load: '12%' },
    { id: 'codex', name: 'CodeX Dev', status: 'busy', load: '78%' },
    { id: 'scholar', name: 'Scholar Research', status: 'idle', load: '3%' },
  ]);
});`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        content: `# NEXUS Node API

API REST développée avec Express.

## Lancement

\`\`\`bash
npm install
npm run dev
\`\`\`

Testez ensuite :
\`\`\`bash
curl http://localhost:3000/api/health
\`\`\``,
      },
    ],
  },
  {
    id: 'php-app',
    name: 'Projet PHP',
    description: 'Application PHP orientée services avec routeur léger, gestionnaire de configuration et PDO.',
    category: 'backend',
    icon: 'FileCode',
    badge: 'PHP 8.2+',
    executionType: 'server-required',
    serverRequirements: {
      runtime: 'PHP ≥ 8.1 (avec CLI ou serveur web Apache/Nginx)',
      dependencies: ['ext-json', 'ext-pdo'],
      installCommand: 'composer install (si dépendances externes)',
      runCommand: 'php -S localhost:8000',
      port: 8000,
      notes: 'Ce projet requiert l’interpréteur PHP sur votre machine pour exécuter le serveur de test local.',
    },
    defaultFiles: [
      {
        name: 'index.php',
        path: 'index.php',
        language: 'php',
        content: `<?php
/**
 * NEXUS LAB — Point d'entrée de l'application PHP
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if ($uri === '/' || $uri === '/index.php') {
    echo json_encode([
        'app' => APP_NAME,
        'version' => APP_VERSION,
        'php_version' => PHP_VERSION,
        'endpoints' => [
            '/api/status' => 'État de santé du système',
            '/api/ping'   => 'Test de latence'
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/status') {
    require_once __DIR__ . '/api/status.php';
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint introuvable', 'uri' => $uri]);`,
      },
      {
        name: 'config.php',
        path: 'config.php',
        language: 'php',
        content: `<?php
// Configuration globale de l'application
define('APP_NAME', 'NEXUS PHP Service');
define('APP_VERSION', '1.0.0');
define('ENV', 'development');

ini_set('display_errors', '1');
error_reporting(E_ALL);`,
      },
      {
        name: 'status.php',
        path: 'api/status.php',
        language: 'php',
        content: `<?php
// Contrôleur de statut
$status = [
    'status' => 'healthy',
    'memory_usage_mb' => round(memory_get_usage(true) / 1024 / 1024, 2),
    'timestamp' => date('c'),
    'php_sapi' => php_sapi_name()
];

echo json_encode($status, JSON_PRETTY_PRINT);`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        content: `# Application PHP — NEXUS LAB

## Exécution locale

\`\`\`bash
# Lancez le serveur interne PHP
php -S localhost:8000
\`\`\`

Ouvrez ensuite votre navigateur sur **http://localhost:8000**.`,
      },
    ],
  },
  {
    id: 'python-app',
    name: 'Projet Python',
    description: 'Service Python modulaire (FastAPI / analyse) avec typage strict et structure de modules.',
    category: 'backend',
    icon: 'Terminal',
    badge: 'Python 3.10+',
    executionType: 'server-required',
    serverRequirements: {
      runtime: 'Python ≥ 3.10 (avec pip)',
      dependencies: ['fastapi>=0.110.0', 'uvicorn>=0.28.0', 'pydantic>=2.6.0'],
      installCommand: 'pip install -r requirements.txt',
      runCommand: 'uvicorn main:app --reload',
      port: 8000,
      notes: 'Ce projet requiert l’interpréteur Python et Uvicorn pour démarrer le serveur ASGI asynchrone.',
    },
    defaultFiles: [
      {
        name: 'main.py',
        path: 'main.py',
        language: 'python',
        content: `"""
NEXUS LAB — Service API FastAPI en Python 3
"""
from datetime import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from utils import calculate_health_score

app = FastAPI(
    title="NEXUS Python API",
    description="Microservice performant conçu avec FastAPI",
    version="1.0.0"
)

class SystemMetric(BaseModel):
    cpu_percent: float
    memory_percent: float
    active_connections: int

@app.get("/")
def read_root():
    return {
        "service": "NEXUS Python Engine",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/diagnostics")
def run_diagnostics(metric: SystemMetric):
    score = calculate_health_score(metric.cpu_percent, metric.memory_percent)
    return {
        "input": metric.model_dump(),
        "health_score": score,
        "recommendation": "Optimal" if score > 80 else "Attention requise"
    }

if __name__ == "__main__":
    import uvicorn
    print("Démarrage du serveur Uvicorn sur http://127.0.0.1:8000")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
`,
      },
      {
        name: 'utils.py',
        path: 'utils.py',
        language: 'python',
        content: `"""
Modules utilitaires pour les calculs de santé système.
"""

def calculate_health_score(cpu: float, mem: float) -> float:
    """
    Calcule un indice de santé composite entre 0 et 100.
    """
    penalty = (cpu * 0.6) + (mem * 0.4)
    score = max(0.0, min(100.0, 100.0 - penalty))
    return round(score, 1)
`,
      },
      {
        name: 'requirements.txt',
        path: 'requirements.txt',
        language: 'plaintext',
        content: `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
`,
      },
      {
        name: 'README.md',
        path: 'README.md',
        language: 'markdown',
        content: `# Projet Python — NEXUS LAB

## Préparation de l'environnement virtuel

\`\`\`bash
# Créer et activer l'environnement
python -m venv venv
source venv/bin/activate  # Sur Windows : venv\\Scripts\\activate

# Installer les dépendances
pip install -r requirements.txt

# Démarrer le serveur API
python main.py
\`\`\`

Documentation interactive Swagger disponible sur **http://localhost:8000/docs**.`,
      },
    ],
  },
];
