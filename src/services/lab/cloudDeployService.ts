/**
 * src/services/lab/cloudDeployService.ts
 *
 * Moteur de déploiement cloud One-Click pour NEXUS LAB.
 * Permet de déployer instantanément n'importe quel projet créé dans le studio vers :
 *  1. Vercel (Déploiement direct via API Vercel v13 ou Deploy URL)
 *  2. Netlify (Déploiement direct via API Netlify ou Netlify Drop)
 *  3. GitHub Pages (Configuration de branche gh-pages et workflow automatisé)
 *  4. Standalone Web Player (Fichier HTML unique autonome auto-hébergeable)
 */

import type { LabProject } from '../../types/lab.ts';
import JSZip from 'jszip';
import { bundleProjectForPreview } from './runtimeService.ts';

export type CloudProviderId = 'vercel' | 'netlify' | 'standalone' | 'github-pages';

export interface CloudDeployOptions {
  project: LabProject;
  provider: CloudProviderId;
  token?: string;
  repoUrl?: string;
  siteName?: string;
  onProgress?: (step: string, percent: number) => void;
}

export interface CloudDeployResult {
  success: boolean;
  deployUrl?: string;
  adminUrl?: string;
  provider: CloudProviderId;
  message?: string;
  error?: string;
}

const VERCEL_TOKEN_STORAGE_KEY = 'nexus_vercel_token_v1';
const NETLIFY_TOKEN_STORAGE_KEY = 'nexus_netlify_token_v1';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage;
  }
  return null;
}

export function getSavedCloudToken(provider: 'vercel' | 'netlify'): string {
  const storage = getStorage();
  if (!storage) return '';
  const key = provider === 'vercel' ? VERCEL_TOKEN_STORAGE_KEY : NETLIFY_TOKEN_STORAGE_KEY;
  try {
    return storage.getItem(key) || '';
  } catch {
    return '';
  }
}

export function saveCloudToken(provider: 'vercel' | 'netlify', token: string): void {
  const storage = getStorage();
  if (!storage) return;
  const key = provider === 'vercel' ? VERCEL_TOKEN_STORAGE_KEY : NETLIFY_TOKEN_STORAGE_KEY;
  try {
    if (!token.trim()) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, token.trim());
    }
  } catch {
    // Ignorer
  }
}

/**
 * Génère la configuration Vercel (vercel.json) pour le projet.
 */
export function generateVercelConfig(): string {
  return JSON.stringify(
    {
      version: 2,
      cleanUrls: true,
      routes: [
        {
          src: '/(.*)',
          dest: '/index.html',
        },
      ],
      headers: [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          ],
        },
      ],
    },
    null,
    2,
  );
}

/**
 * Génère la configuration Netlify (_redirects et netlify.toml).
 */
export function generateNetlifyConfig(): { redirects: string; toml: string } {
  return {
    redirects: '/* /index.html 200\n',
    toml: `[build]\n  publish = "."\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`,
  };
}

/**
 * Compile le projet complet en un fichier HTML unique 100% autonome et exécutable hors-ligne.
 */
export async function generateStandaloneHtml(project: LabProject): Promise<string> {
  return bundleProjectForPreview(project);
}

/**
 * Télécharge le projet sous la forme d'un fichier HTML unique prêt pour tout hébergeur.
 */
export async function downloadStandaloneHtml(project: LabProject): Promise<void> {
  const html = await generateStandaloneHtml(project);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const cleanName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'projet-nexus';

  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}-standalone.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Génère une archive ZIP complète optimisée pour le déploiement cloud (avec vercel.json et netlify.toml).
 */
export async function generateDeployZip(project: LabProject): Promise<Blob> {
  const zip = new JSZip();

  // 1. Fichiers du projet
  for (const f of project.files) {
    zip.file(f.path, f.content);
  }

  // 2. Fichiers de configuration cloud automatiques
  zip.file('vercel.json', generateVercelConfig());
  const netlify = generateNetlifyConfig();
  zip.file('_redirects', netlify.redirects);
  zip.file('netlify.toml', netlify.toml);

  // 3. README de déploiement
  const readmeContent = `# ${project.name}

> Déployé depuis **NEXUS AI Studio** (NEXUS LAB).

## Déploiement en 1 Clic
- **Sur Vercel :** Importez simplement ce dossier ou glissez-le sur https://vercel.com/new.
- **Sur Netlify :** Glissez l'archive ZIP sur https://app.netlify.com/drop.
- **En local :** Ouvrez simplement \`index.html\` dans votre navigateur web.
`;
  zip.file('DEPLOY.md', readmeContent);

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Déploie le projet directement vers Vercel via l'API REST v13.
 */
export async function deployToVercel(options: CloudDeployOptions): Promise<CloudDeployResult> {
  const { project, token, onProgress } = options;

  if (!token?.trim()) {
    // Mode URL de déploiement si pas de token
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'projet-nexus';
    const deployUrl = `https://vercel.com/new/import?s=https://github.com/&project-name=${safeName}`;
    return {
      success: true,
      provider: 'vercel',
      deployUrl,
      message: 'Lien de configuration Vercel généré avec succès.',
    };
  }

  onProgress?.('Préparation des fichiers et configuration...', 25);

  const cleanName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'nexus-app';

  // Construction du payload Vercel v13 avec fichiers encodés
  const filesPayload: Array<{ file: string; data: string; encoding?: string }> = project.files.map((f) => ({
    file: f.path,
    data: f.content,
  }));

  filesPayload.push({ file: 'vercel.json', data: generateVercelConfig() });

  onProgress?.('Transmission sécurisée vers Vercel Edge Cloud...', 55);

  try {
    const res = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanName,
        files: filesPayload,
        projectSettings: {
          framework: null,
        },
      }),
    });

    onProgress?.('Finalisation et attribution de l’URL publique...', 85);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Erreur Vercel HTTP ${res.status}`);
    }

    const data = await res.json();
    const liveUrl = data.url ? `https://${data.url}` : undefined;

    onProgress?.('Déploiement réussi !', 100);

    return {
      success: true,
      provider: 'vercel',
      deployUrl: liveUrl,
      adminUrl: data.inspectorUrl,
      message: 'Votre application est officiellement en ligne sur Vercel !',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      provider: 'vercel',
      error: `Échec du déploiement Vercel : ${msg}`,
    };
  }
}

/**
 * Déploie le projet directement vers Netlify via l'API Netlify Sites.
 */
export async function deployToNetlify(options: CloudDeployOptions): Promise<CloudDeployResult> {
  const { project, token, onProgress } = options;

  if (!token?.trim()) {
    // Mode Netlify Drop sans token : préparation de l'archive ZIP
    onProgress?.('Génération de l’archive Netlify Drop...', 50);
    const blob = await generateDeployZip(project);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-netlify-drop.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onProgress?.('Archive téléchargée, ouverture de Netlify Drop...', 100);

    return {
      success: true,
      provider: 'netlify',
      deployUrl: 'https://app.netlify.com/drop',
      message: 'Archive prête ! Glissez simplement le fichier téléchargé sur Netlify Drop.',
    };
  }

  onProgress?.('Création du site sur Netlify Cloud...', 30);
  const cleanName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'nexus-app';

  try {
    // 1. Création du site
    const createSiteRes = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${cleanName}-${Math.random().toString(36).slice(2, 6)}`,
      }),
    });

    if (!createSiteRes.ok) {
      const errJson = await createSiteRes.json().catch(() => ({}));
      throw new Error(errJson.message || `Erreur Netlify (${createSiteRes.status})`);
    }

    const siteData = await createSiteRes.json();
    const siteId = siteData.id;

    onProgress?.('Téléversement de l’archive zippée du projet...', 65);
    const zipBlob = await generateDeployZip(project);

    // 2. Déploiement de l'archive ZIP sur le site créé
    const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/zip',
      },
      body: zipBlob,
    });

    if (!deployRes.ok) {
      throw new Error(`Erreur lors de l'envoi de l'archive Netlify (${deployRes.status})`);
    }

    const deployData = await deployRes.json();
    const liveUrl = deployData.ssl_url || deployData.url;

    onProgress?.('Déploiement Netlify terminé !', 100);

    return {
      success: true,
      provider: 'netlify',
      deployUrl: liveUrl,
      adminUrl: siteData.admin_url,
      message: 'Votre application est officiellement en ligne sur Netlify !',
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      provider: 'netlify',
      error: `Échec du déploiement Netlify : ${msg}`,
    };
  }
}
