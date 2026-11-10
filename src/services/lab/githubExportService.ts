/**
 * src/services/lab/githubExportService.ts
 *
 * Service d'export direct de projet vers GitHub (One-Click Push) pour NEXUS LAB.
 * Utilise l'API REST officielle GitHub v3 pour :
 * 1. Valider le token personnel (Personal Access Token - PAT).
 * 2. Créer le dépôt distant (public ou privé).
 * 3. Commiter et synchroniser l'ensemble des fichiers du projet.
 */

import type { LabProject } from '@/types/lab';

export interface GitHubExportOptions {
  token: string;
  repoName: string;
  description?: string;
  isPrivate?: boolean;
  project: LabProject;
  onProgress?: (step: string, percent: number) => void;
}

export interface GitHubExportResult {
  success: boolean;
  repoUrl?: string;
  repoFullName?: string;
  error?: string;
}

const GITHUB_TOKEN_STORAGE_KEY = 'nexus_github_pat_v1';

/**
 * Récupère le token GitHub mémorisé localement.
 */
export function getSavedGitHubToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || '';
}

/**
 * Sauvegarde le token GitHub dans le stockage local.
 */
export function saveGitHubToken(token: string): void {
  if (typeof window === 'undefined') return;
  if (!token.trim()) {
    localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
  } else {
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, token.trim());
  }
}

/**
 * Encode une chaîne UTF-8 en base64 de manière sécurisée pour l'API GitHub.
 */
function utf8ToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
}

/**
 * Exporte un projet complet vers un nouveau dépôt GitHub.
 */
export async function exportProjectToGitHub(options: GitHubExportOptions): Promise<GitHubExportResult> {
  const { token, repoName, description, isPrivate = false, project, onProgress } = options;

  if (!token.trim()) {
    return { success: false, error: 'Token GitHub manquant ou invalide.' };
  }

  const cleanRepoName = repoName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');

  if (!cleanRepoName) {
    return { success: false, error: 'Nom de dépôt GitHub invalide.' };
  }

  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // Étape 1 : Vérification de l'utilisateur authentifié
    onProgress?.('Vérification du compte GitHub...', 10);
    const userRes = await fetch('https://api.github.com/user', { headers });

    if (!userRes.ok) {
      if (userRes.status === 401) {
        return { success: false, error: 'Token d’accès GitHub invalide ou expiré.' };
      }
      return { success: false, error: `Erreur GitHub (${userRes.status}) lors de l’authentification.` };
    }

    const userData = await userRes.json();
    const username = userData.login;

    // Étape 2 : Création du dépôt distant
    onProgress?.(`Création du dépôt « ${cleanRepoName} »...`, 25);
    const createRepoRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: cleanRepoName,
        description: description?.trim() || `Projet exporté depuis NEXUS AI (${project.name})`,
        private: isPrivate,
        auto_init: true, // Initialise avec une branche par défaut
      }),
    });

    let targetRepoFullName = `${username}/${cleanRepoName}`;
    let targetRepoUrl = `https://github.com/${targetRepoFullName}`;

    if (!createRepoRes.ok) {
      const errJson = await createRepoRes.json().catch(() => ({}));
      // Si le dépôt existe déjà, on vérifie s'il appartient bien à l'utilisateur
      if (createRepoRes.status === 422 && String(errJson.message).includes('already exists')) {
        targetRepoFullName = `${username}/${cleanRepoName}`;
        targetRepoUrl = `https://github.com/${targetRepoFullName}`;
      } else {
        return {
          success: false,
          error: errJson.message || `Impossible de créer le dépôt GitHub (${createRepoRes.status}).`,
        };
      }
    } else {
      const createdData = await createRepoRes.json();
      targetRepoFullName = createdData.full_name;
      targetRepoUrl = createdData.html_url;
    }

    // Étape 3 : Commit des fichiers du projet
    const files = project.files;
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const filePath = file.path.replace(/^\/+/, ''); // supprimer slash initial
      const progressPercent = 30 + Math.round(((i + 1) / totalFiles) * 65);
      onProgress?.(`Commit de ${file.name} (${i + 1}/${totalFiles})...`, progressPercent);

      // Vérifier si le fichier existe déjà pour récupérer son sha éventuel
      let existingSha: string | undefined = undefined;
      try {
        const checkRes = await fetch(
          `https://api.github.com/repos/${targetRepoFullName}/contents/${encodeURIComponent(filePath)}`,
          { headers },
        );
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          existingSha = checkData.sha;
        }
      } catch {
        // Ignorer si nouveau fichier
      }

      const contentBase64 = utf8ToBase64(file.content);

      const commitRes = await fetch(
        `https://api.github.com/repos/${targetRepoFullName}/contents/${encodeURIComponent(filePath)}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `NEXUS AI : mise à jour de ${filePath}`,
            content: contentBase64,
            sha: existingSha,
          }),
        },
      );

      if (!commitRes.ok) {
        console.warn(`[GitHub Export] Avertissement commit fichier ${filePath}:`, commitRes.status);
      }
    }

    onProgress?.('Finalisation et publication du dépôt...', 100);

    return {
      success: true,
      repoFullName: targetRepoFullName,
      repoUrl: targetRepoUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur réseau lors de la communication avec GitHub.';
    return { success: false, error: msg };
  }
}
