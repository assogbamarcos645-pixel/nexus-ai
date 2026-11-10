/**
 * src/services/lab/projectService.ts
 *
 * Service de gestion des projets, fichiers, sécurité des chemins,
 * stockage local et export ZIP pour NEXUS LAB.
 */

import JSZip from 'jszip';
import type { LabProject, LabFile, ProjectTemplateId, FileLanguage } from '@/types/lab';
import { LAB_TEMPLATES } from '../../config/labTemplates.ts';
import { generateUUID } from '../../utils/uuid.ts';

const STORAGE_KEY = 'nexus_lab_projects_v1';

export const STORAGE_NOTICE =
  'Stockage local navigateur : vos projets sont enregistrés sur votre machine dans le stockage local de ce navigateur. Aucune synchronisation automatique n’est effectuée entre vos appareils. Pensez à exporter vos projets en archive ZIP.';

// ─── Sécurité & Validation des chemins ────────────────────────────────────────

/**
 * Valide et normalise un chemin de fichier pour empêcher tout directory traversal
 * ou caractère dangereux.
 *
 * Règles :
 *  - Pas de ".." ou de navigation relative parente
 *  - Pas de slash initial ou antislash
 *  - Pas de caractères interdits dans les systèmes de fichiers (< > : " | ? * \0)
 *  - Pas de noms réservés Windows (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 */
export function sanitizeAndValidatePath(rawPath: string): { valid: boolean; normalizedPath: string; error?: string } {
  if (!rawPath || typeof rawPath !== 'string') {
    return { valid: false, normalizedPath: '', error: 'Le chemin du fichier ne peut pas être vide.' };
  }

  // Normalisation des séparateurs
  const trimmed = rawPath.trim().replace(/\\/g, '/');

  if (trimmed.length > 255) {
    return { valid: false, normalizedPath: '', error: 'Le chemin ne peut pas dépasser 255 caractères.' };
  }

  // Interdiction des chemins absolus (ex: /etc, C:/)
  if (trimmed.startsWith('/') || /^[a-zA-Z]:/.test(trimmed)) {
    return { valid: false, normalizedPath: '', error: 'Les chemins absolus sont strictement interdits.' };
  }

  // Découpage en segments pour vérification de chaque niveau
  const segments = trimmed.split('/');

  for (const segment of segments) {
    if (!segment || segment === '.') {
      return { valid: false, normalizedPath: '', error: 'Le chemin contient un segment vide ou invalide.' };
    }

    if (segment === '..') {
      return { valid: false, normalizedPath: '', error: 'Tentative de sortie de répertoire interdite ("..").' };
    }

    // Caractères interdits
    if (/[\0<>:"|?*]/.test(segment)) {
      return { valid: false, normalizedPath: '', error: 'Le nom de fichier contient des caractères interdits (< > : " | ? *).' };
    }

    // Noms réservés Windows
    const baseName = segment.split('.')[0].toUpperCase();
    if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/.test(baseName)) {
      return { valid: false, normalizedPath: '', error: `Le nom "${baseName}" est réservé par le système d'exploitation.` };
    }
  }

  return { valid: true, normalizedPath: segments.join('/') };
}

/**
 * Détermine le langage de code à partir de l'extension de fichier.
 */
export function detectLanguage(path: string): FileLanguage {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'py':
      return 'python';
    case 'php':
      return 'php';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

// ─── Projets de démonstration ────────────────────────────────────────────────

export function generateInitialDemoProjects(): LabProject[] {
  // Placer le modèle interactif 'html-css-js' en première position pour offrir une prévisualisation immédiate
  const orderedTemplates = [
    ...LAB_TEMPLATES.filter((t) => t.id === 'html-css-js'),
    ...LAB_TEMPLATES.filter((t) => t.id !== 'html-css-js'),
  ];

  return orderedTemplates.map((tmpl, idx) => ({
    id: `demo-${tmpl.id}`,
    name: tmpl.name,
    description: tmpl.description,
    templateId: tmpl.id,
    isDemo: true,
    createdAt: new Date(Date.now() - (5 - idx) * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - (5 - idx) * 1800000).toISOString(),
    files: tmpl.defaultFiles.map((file, fileIdx) => ({
      id: `file-demo-${tmpl.id}-${fileIdx}`,
      name: file.name,
      path: file.path,
      content: file.content,
      language: file.language,
      isModified: false,
    })),
  }));
}

// ─── Stockage Local ──────────────────────────────────────────────────────────

export function loadProjectsFromStorage(): LabProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Si l'utilisateur n'a créé aucun projet personnel et qu'il n'y a que d'anciennes démos pré-injectées,
      // ne pas forcer l'ouverture automatique sur les démos au démarrage
      const hasRealUserProject = parsed.some((p: LabProject) => !p.isDemo && !p.id?.startsWith('demo-'));
      if (hasRealUserProject) {
        return parsed;
      }
      return [];
    }
    return [];
  } catch (err) {
    console.warn('[NEXUS LAB] Erreur lors du chargement du stockage local:', err);
    return [];
  }
}

export function saveProjectsToStorage(projects: LabProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('[NEXUS LAB] Impossible de sauvegarder les projets dans le localStorage:', err);
  }
}

// ─── CRUD Projets ─────────────────────────────────────────────────────────────

export function createProjectFromTemplate(
  templateId: ProjectTemplateId,
  customName?: string,
): LabProject {
  const template = LAB_TEMPLATES.find((t) => t.id === templateId) ?? LAB_TEMPLATES[0];
  const timestamp = new Date().toISOString();
  const id = generateUUID();

  return {
    id,
    name: customName?.trim() || `${template.name} #${Math.floor(100 + Math.random() * 900)}`,
    description: template.description,
    templateId,
    isDemo: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    files: template.defaultFiles.map((f) => ({
      id: generateUUID(),
      name: f.name,
      path: f.path,
      content: f.content,
      language: f.language,
      isModified: false,
    })),
  };
}

export function addFileToProject(
  project: LabProject,
  rawPath: string,
  initialContent = '',
): { updatedProject: LabProject; newFile?: LabFile; error?: string } {
  const validation = sanitizeAndValidatePath(rawPath);
  if (!validation.valid) {
    return { updatedProject: project, error: validation.error };
  }

  const normalizedPath = validation.normalizedPath;

  // Vérifier qu'un fichier avec ce chemin n'existe pas déjà
  const exists = project.files.some((f) => f.path.toLowerCase() === normalizedPath.toLowerCase());
  if (exists) {
    return { updatedProject: project, error: `Un fichier existe déjà au chemin "${normalizedPath}".` };
  }

  const name = normalizedPath.split('/').pop() || normalizedPath;
  const newFile: LabFile = {
    id: generateUUID(),
    name,
    path: normalizedPath,
    content: initialContent,
    language: detectLanguage(normalizedPath),
    isModified: true,
  };

  const updatedProject: LabProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    files: [...project.files, newFile],
  };

  return { updatedProject, newFile };
}

export function deleteFileFromProject(
  project: LabProject,
  fileId: string,
): { updatedProject: LabProject; error?: string } {
  if (project.files.length <= 1) {
    return { updatedProject: project, error: 'Un projet doit conserver au minimum un fichier.' };
  }

  const updatedFiles = project.files.filter((f) => f.id !== fileId);
  return {
    updatedProject: {
      ...project,
      updatedAt: new Date().toISOString(),
      files: updatedFiles,
    },
  };
}

// ─── Export ZIP ───────────────────────────────────────────────────────────────

/**
 * Exporte l'intégralité du projet sous forme d'archive .zip sécurisée.
 */
export async function exportProjectAsZip(project: LabProject): Promise<Blob> {
  const zip = new JSZip();

  for (const file of project.files) {
    zip.file(file.path, file.content);
  }

  // Ajout d'une notice explicative dans l'archive
  const manifest = {
    name: project.name,
    templateId: project.templateId,
    exportedAt: new Date().toISOString(),
    exportedBy: 'NEXUS LAB v0.3.0',
    fileCount: project.files.length,
  };
  zip.file('.nexus-meta.json', JSON.stringify(manifest, null, 2));

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Déclenche le téléchargement du Blob ZIP dans le navigateur.
 */
export function triggerZipDownload(blob: Blob, projectName: string): void {
  const safeName = projectName.toLowerCase().replace(/[^a-z0-9-_]/g, '_') || 'nexus_project';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
