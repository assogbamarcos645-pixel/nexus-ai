/**
 * src/services/lab/monacoPreloadService.ts
 *
 * Service d'accélération et de préchargement de Monaco Editor pour NEXUS LAB.
 * Initialise le bundle et les workers Monaco en arrière-plan pendant les phases
 * d'inactivité du navigateur (requestIdleCallback) pour éliminer tout délai de latence
 * lorsque l'utilisateur bascule sur l'espace de code.
 */

import { loader } from '@monaco-editor/react';

let isPreloadStarted = false;
let isMonacoReady = false;

/**
 * Lance le préchargement optimisé de Monaco Editor.
 * Idempotent et sans blocage du thread principal UI.
 */
export function preloadMonaco(): Promise<any> {
  if (isMonacoReady) return Promise.resolve();
  if (isPreloadStarted) return Promise.resolve();
  isPreloadStarted = true;

  return loader
    .init()
    .then((monaco) => {
      isMonacoReady = true;
      return monaco;
    })
    .catch((err) => {
      console.warn('[NEXUS LAB] Préchargement différé de Monaco Editor:', err);
      isPreloadStarted = false;
    });
}

/**
 * Planifie le préchargement dès que le processeur du navigateur est au repos.
 */
export function scheduleMonacoPreload(delayMs = 600) {
  if (typeof window === 'undefined') return;

  const trigger = () => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(
        () => {
          preloadMonaco();
        },
        { timeout: 3000 },
      );
    } else {
      setTimeout(preloadMonaco, 300);
    }
  };

  setTimeout(trigger, delayMs);
}

export function isMonacoPreloaded(): boolean {
  return isMonacoReady;
}
