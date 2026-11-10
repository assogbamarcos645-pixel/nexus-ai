/**
 * src/hooks/useNexusLab.ts
 *
 * Hook d'état principal pour la gestion de NEXUS LAB.
 * Coordonne les projets, le fichier actif, les brouillons de modifications (drafts),
 * les sauvegardes, l'historique, l'exportation ZIP et la synchronisation cloud avec Supabase.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { LabProject, LabFile, ProjectTemplateId, LabTab, DevProposal } from '@/types/lab';
import type { ProjectSnapshot } from '@/types/snapshot';
import {
  loadProjectsFromStorage,
  saveProjectsToStorage,
  createProjectFromTemplate,
  addFileToProject,
  deleteFileFromProject,
  generateInitialDemoProjects,
  exportProjectAsZip,
  triggerZipDownload,
} from '@/services/lab/projectService';
import {
  loadSnapshots,
  createSnapshot,
  deleteSnapshot as removeSnapshot,
} from '@/services/lab/snapshotService';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchCloudProjects,
  saveProjectToCloud,
  deleteProjectFromCloud,
} from '@/services/sync/syncService';

export function useNexusLab() {
  const { user, isAuthenticated, isConfigured } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);

  const [projects, setProjects] = useState<LabProject[]>(() => {
    return loadProjectsFromStorage();
  });
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const list = loadProjectsFromStorage();
    return list[0]?.id || '';
  });

  const activeProject = useMemo(() => {
    if (!projects.length) return null;
    return projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;
  }, [projects, activeProjectId]);

  const [selectedFileId, setSelectedFileId] = useState<string>(() => {
    const list = loadProjectsFromStorage();
    return list[0]?.files?.[0]?.id || '';
  });

  // Résolution du fichier actif
  const activeFile = useMemo(() => {
    if (!activeProject || !activeProject.files.length) return null;
    return activeProject.files.find((f) => f.id === selectedFileId) ?? activeProject.files[0];
  }, [activeProject, selectedFileId]);

  // Dictionnaire des brouillons en cours de modification : fileId -> content
  const [fileDrafts, setFileDrafts] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<LabTab>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Instantanés (Snapshots & Historique) pour le projet actif
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>(() => {
    const list = loadProjectsFromStorage();
    const pid = list[0]?.id;
    return pid ? loadSnapshots(pid) : [];
  });

  // Recharger les snapshots quand le projet actif change
  useEffect(() => {
    if (activeProjectId) {
      setSnapshots(loadSnapshots(activeProjectId));
    } else {
      setSnapshots([]);
    }
  }, [activeProjectId]);

  // Écoute des ouvertures de projet déclenchées par la vision multimodale dans le chat
  useEffect(() => {
    const handleOpenProject = (e: Event) => {
      const customEvt = e as CustomEvent<{ projectId?: string }>;
      const targetId = customEvt.detail?.projectId;
      const list = loadProjectsFromStorage();
      setProjects(list);
      if (targetId) {
        setActiveProjectId(targetId);
        const p = list.find((item) => item.id === targetId);
        if (p?.files?.[0]) {
          setSelectedFileId(p.files[0].id);
        }
      }
      setActiveTab('editor');
    };
    window.addEventListener('nexus-open-project', handleOpenProject);
    return () => window.removeEventListener('nexus-open-project', handleOpenProject);
  }, []);

  // Contenu actuel de l'éditeur (brouillon si modifié, sinon contenu officiel)
  const editorContent = useMemo(() => {
    if (!activeFile) return '';
    return fileDrafts[activeFile.id] !== undefined ? fileDrafts[activeFile.id] : activeFile.content;
  }, [activeFile, fileDrafts]);

  // Projet actif avec les modifications en direct (brouillons) injectées pour que l'aperçu soit temps réel
  const activeProjectWithDrafts = useMemo(() => {
    if (!activeProject) return null;
    return {
      ...activeProject,
      files: activeProject.files.map((f) => ({
        ...f,
        content: fileDrafts[f.id] !== undefined ? fileDrafts[f.id] : f.content,
      })),
    };
  }, [activeProject, fileDrafts]);

  // Persistance automatique dans le stockage local
  useEffect(() => {
    saveProjectsToStorage(projects);
  }, [projects]);

  // Chargement des projets cloud lors de l'authentification
  useEffect(() => {
    if (!isConfigured || !isAuthenticated || !user) {
      if (lastUserIdRef.current !== null) {
        lastUserIdRef.current = null;
        setProjects(loadProjectsFromStorage());
      }
      return;
    }

    if (lastUserIdRef.current === user.id) return;
    lastUserIdRef.current = user.id;

    let isMounted = true;
    fetchCloudProjects(user.id).then((cloudProjects) => {
      if (!isMounted) return;
      if (cloudProjects.length > 0) {
        setProjects((prev) => {
          const cloudIds = new Set(cloudProjects.map((p) => p.id));
          const localOnly = prev.filter((p) => !cloudIds.has(p.id));
          return [...cloudProjects, ...localOnly];
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isConfigured, user]);

  // Détection des modifications non enregistrées
  const hasUnsavedChanges = useMemo(() => {
    if (!activeFile) return false;
    return fileDrafts[activeFile.id] !== undefined && fileDrafts[activeFile.id] !== activeFile.content;
  }, [fileDrafts, activeFile]);

  // Mise à jour du contenu dans l'éditeur (brouillon)
  const setEditorContent = useCallback(
    (newContent: string) => {
      if (!activeFile) return;
      setFileDrafts((prev) => ({
        ...prev,
        [activeFile.id]: newContent,
      }));
    },
    [activeFile],
  );

  // Sauvegarder le fichier actif (localement et dans le cloud si connecté)
  const saveActiveFile = useCallback(() => {
    if (!activeProject || !activeFile) return;

    const contentToSave = fileDrafts[activeFile.id] !== undefined ? fileDrafts[activeFile.id] : activeFile.content;

    setIsSaving(true);
    let updatedProjForCloud: LabProject | null = null;

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== activeProject.id) return proj;
        const updatedFiles = proj.files.map((f) => {
          if (f.id !== activeFile.id) return f;
          return {
            ...f,
            content: contentToSave,
            isModified: false,
          };
        });
        const updated = {
          ...proj,
          updatedAt: new Date().toISOString(),
          isCloudSynced: isAuthenticated ? true : proj.isCloudSynced,
          files: updatedFiles,
        };
        updatedProjForCloud = updated;
        return updated;
      }),
    );

    // Nettoyer le brouillon pour ce fichier car il est sauvegardé
    setFileDrafts((prev) => {
      const next = { ...prev };
      delete next[activeFile.id];
      return next;
    });

    // Synchronisation cloud automatique si l'utilisateur est connecté
    if (isAuthenticated && user && updatedProjForCloud) {
      saveProjectToCloud(user.id, updatedProjForCloud)
        .then(() => {
          console.log('[NEXUS LAB] Projet synchronisé avec succès sur Supabase Cloud.');
        })
        .catch((err) => {
          console.warn('[NEXUS LAB] Échec synchronisation cloud projet:', err);
        });
    }

    setTimeout(() => {
      setIsSaving(false);
      setNotification({
        message: `Fichier "${activeFile.name}" enregistré${isAuthenticated ? ' & synchronisé au Cloud' : ''}.`,
        type: 'success',
      });
    }, 120);
  }, [activeProject, activeFile, fileDrafts, isAuthenticated, user]);

  // Créer un projet à partir d'un modèle
  const createProject = useCallback(
    (templateId: ProjectTemplateId, customName?: string) => {
      const newProj = createProjectFromTemplate(templateId, customName);
      if (isAuthenticated) {
        newProj.isCloudSynced = true;
      }
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
      if (newProj.files.length > 0) {
        setSelectedFileId(newProj.files[0].id);
      }

      if (isAuthenticated && user) {
        saveProjectToCloud(user.id, newProj).catch((err) => {
          console.warn('[NEXUS LAB] Erreur création cloud projet:', err);
        });
      }

      setNotification({ message: `Projet "${newProj.name}" créé avec succès !`, type: 'success' });
      return newProj;
    },
    [isAuthenticated, user],
  );

  // Supprimer un projet
  const deleteProject = useCallback(
    async (projectId: string) => {
      if (projects.length <= 1) {
        setNotification({ message: 'Vous devez conserver au moins un projet.', type: 'error' });
        return;
      }

      const projToDelete = projects.find((p) => p.id === projectId);
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);

      if (activeProjectId === projectId) {
        setActiveProjectId(remaining[0]?.id || '');
        if (remaining[0]?.files?.[0]) {
          setSelectedFileId(remaining[0].files[0].id);
        }
      }

      if (isAuthenticated && user && projToDelete?.isCloudSynced) {
        await deleteProjectFromCloud(user.id, projectId);
      }

      setNotification({ message: 'Projet supprimé.', type: 'info' });
    },
    [projects, activeProjectId, isAuthenticated, user],
  );

  // Ajouter un fichier au projet actif
  const addFile = useCallback(
    (rawPath: string, initialContent = ''): { success: boolean; error?: string } => {
      if (!activeProject) return { success: false, error: 'Aucun projet sélectionné.' };

      const { updatedProject, newFile, error } = addFileToProject(activeProject, rawPath, initialContent);
      if (error) {
        return { success: false, error };
      }

      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
      if (newFile) {
        setSelectedFileId(newFile.id);
        setNotification({ message: `Fichier "${newFile.path}" ajouté.`, type: 'success' });
      }

      if (isAuthenticated && user) {
        saveProjectToCloud(user.id, updatedProject).catch((err) => {
          console.warn('[NEXUS LAB] Erreur synchronisation après ajout fichier:', err);
        });
      }

      return { success: true };
    },
    [activeProject, isAuthenticated, user],
  );

  // Supprimer un fichier
  const deleteFile = useCallback(
    (fileId: string): { success: boolean; error?: string } => {
      if (!activeProject) return { success: false, error: 'Aucun projet sélectionné.' };

      const { updatedProject, error } = deleteFileFromProject(activeProject, fileId);
      if (error) {
        return { success: false, error };
      }

      setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));

      // Nettoyer d'éventuels brouillons
      setFileDrafts((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });

      // Si le fichier supprimé était actif, basculer sur un autre
      if (selectedFileId === fileId) {
        const nextFile = updatedProject.files[0];
        if (nextFile) {
          setSelectedFileId(nextFile.id);
        }
      }

      if (isAuthenticated && user) {
        saveProjectToCloud(user.id, updatedProject).catch((err) => {
          console.warn('[NEXUS LAB] Erreur synchronisation après suppression fichier:', err);
        });
      }

      setNotification({ message: 'Fichier supprimé.', type: 'info' });
      return { success: true };
    },
    [activeProject, selectedFileId, isAuthenticated, user],
  );

  // Réinitialiser les projets de démonstration
  const resetDemoProjects = useCallback(() => {
    const demos = generateInitialDemoProjects();
    setProjects(demos);
    setFileDrafts({});
    setActiveProjectId(demos[0]?.id || '');
    if (demos[0]?.files?.[0]) {
      setSelectedFileId(demos[0].files[0].id);
    }
    setNotification({ message: 'Projets de démonstration réinitialisés.', type: 'info' });
  }, []);

  // Exporter le projet en ZIP
  const downloadZip = useCallback(async () => {
    if (!activeProject) return;
    setIsExporting(true);
    try {
      const projectWithDrafts: LabProject = {
        ...activeProject,
        files: activeProject.files.map((f) => ({
          ...f,
          content: fileDrafts[f.id] !== undefined ? fileDrafts[f.id] : f.content,
        })),
      };

      const blob = await exportProjectAsZip(projectWithDrafts);
      triggerZipDownload(blob, activeProject.name);
      setNotification({ message: `Archive ZIP de "${activeProject.name}" téléchargée.`, type: 'success' });
    } catch (err) {
      console.error('[NEXUS LAB] Erreur lors de la génération ZIP:', err);
      setNotification({ message: "Échec de l'exportation ZIP.", type: 'error' });
    } finally {
      setIsExporting(false);
    }
  }, [activeProject, fileDrafts]);

  // Appliquer une proposition de code de NEXUS DEV
  const applyProposal = useCallback(
    (proposal: DevProposal) => {
      if (!activeProject || !activeFile) return;

      // Sauvegarde automatique d'un instantané avant d'écraser le fichier
      createSnapshot(
        activeProject.id,
        activeProject.files,
        `Avant modif: ${proposal.filePath}`,
        'ai-dev',
        proposal.explanation ? proposal.explanation.slice(0, 120) : undefined,
      );
      setSnapshots(loadSnapshots(activeProject.id));

      let updatedForCloud: LabProject | null = null;
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          const updatedFiles = proj.files.map((f) => {
            if (f.path !== proposal.filePath) return f;
            return {
              ...f,
              content: proposal.suggestedCode,
              isModified: false,
            };
          });
          const updated = {
            ...proj,
            updatedAt: new Date().toISOString(),
            files: updatedFiles,
          };
          updatedForCloud = updated;
          return updated;
        }),
      );

      // Nettoyer le brouillon pour ce fichier
      setFileDrafts((prev) => {
        const next = { ...prev };
        delete next[activeFile.id];
        return next;
      });

      if (isAuthenticated && user && updatedForCloud) {
        saveProjectToCloud(user.id, updatedForCloud).catch((err) => {
          console.warn('[NEXUS LAB] Erreur sauvegarde après proposal dev:', err);
        });
      }

      setNotification({ message: `Proposition de NEXUS DEV appliquée à "${proposal.filePath}".`, type: 'success' });
    },
    [activeProject, activeFile, isAuthenticated, user],
  );

  // Création d'un instantané manuel par l'utilisateur
  const createManualSnapshot = useCallback(
    (label = 'Instantané manuel', description?: string) => {
      if (!activeProject) return;
      const snap = createSnapshot(activeProject.id, activeProject.files, label, 'user', description);
      setSnapshots(loadSnapshots(activeProject.id));
      setNotification({ message: `Instantané "${snap.label}" sauvegardé avec succès.`, type: 'success' });
      return snap;
    },
    [activeProject],
  );

  // Restauration d'un instantané spécifique (Rollback)
  const rollbackToSnapshot = useCallback(
    (snapshotId: string) => {
      if (!activeProject) return;
      const target = snapshots.find((s) => s.id === snapshotId);
      if (!target) {
        setNotification({ message: 'Instantané introuvable.', type: 'error' });
        return;
      }

      // Instantané de sécurité de l'état actuel avant restauration
      createSnapshot(
        activeProject.id,
        activeProject.files,
        `Sécurité : avant retour à "${target.label}"`,
        'auto',
      );

      let updatedForCloud: LabProject | null = null;
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          const restoredFiles = target.files.map((f) => ({
            ...f,
            isModified: false,
          }));
          const updated = {
            ...proj,
            updatedAt: new Date().toISOString(),
            files: restoredFiles,
          };
          updatedForCloud = updated;
          return updated;
        }),
      );

      setFileDrafts({});
      setSnapshots(loadSnapshots(activeProject.id));

      if (isAuthenticated && user && updatedForCloud) {
        saveProjectToCloud(user.id, updatedForCloud).catch((err) => {
          console.warn('[NEXUS LAB] Erreur sync cloud après restauration:', err);
        });
      }

      setNotification({ message: `Projet restauré avec succès à "${target.label}".`, type: 'success' });
    },
    [activeProject, snapshots, isAuthenticated, user],
  );

  // Annulation rapide de la dernière modification (Undo)
  const undoLastChange = useCallback(() => {
    if (!snapshots.length) {
      setNotification({ message: 'Aucun instantané disponible pour annuler.', type: 'info' });
      return;
    }
    const latest = snapshots[0];
    rollbackToSnapshot(latest.id);
  }, [snapshots, rollbackToSnapshot]);

  // Suppression d'un instantané
  const deleteSnapshotById = useCallback(
    (snapshotId: string) => {
      if (!activeProject) return;
      const updated = removeSnapshot(activeProject.id, snapshotId);
      setSnapshots(updated);
      setNotification({ message: 'Instantané supprimé.', type: 'info' });
    },
    [activeProject],
  );

  const updateProjectFiles = useCallback(
    (updatedFiles: LabFile[]) => {
      if (!activeProject) return;
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          return {
            ...proj,
            updatedAt: new Date().toISOString(),
            files: updatedFiles,
          };
        }),
      );
    },
    [activeProject],
  );

  const updateProjectMockupImage = useCallback(
    (mockupImage?: string) => {
      if (!activeProject) return;
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProject.id) return proj;
          return {
            ...proj,
            updatedAt: new Date().toISOString(),
            mockupImage,
          };
        }),
      );
    },
    [activeProject],
  );

  return {
    projects,
    activeProject,
    activeProjectWithDrafts,
    activeProjectId,
    setActiveProjectId,
    activeFile,
    activeFileId: selectedFileId,
    setActiveFileId: setSelectedFileId,
    editorContent,
    setEditorContent,
    hasUnsavedChanges,
    isSaving,
    isExporting,
    activeTab,
    setActiveTab,
    notification,
    clearNotification: () => setNotification(null),
    saveActiveFile,
    createProject,
    deleteProject,
    addFile,
    deleteFile,
    resetDemoProjects,
    downloadZip,
    applyProposal,
    snapshots,
    createManualSnapshot,
    rollbackToSnapshot,
    undoLastChange,
    deleteSnapshotById,
    updateProjectFiles,
    updateProjectMockupImage,
  };
}
