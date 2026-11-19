/**
 * src/components/lab/TestGeneratorModal.tsx
 *
 * Interface modale du Générateur de Tests 1-Clic (#6) pour NEXUS LAB.
 * Affiche l'analyse statique des composants du projet, prévisualise les suites
 * de tests Vitest / Testing Library / Playwright et permet l'injection immédiate.
 */

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import type { LabProject } from '@/types/lab';
import {
  generateProjectTestSuite,
  type GeneratedTestSuite,
} from '@/services/lab/testGeneratorService';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface TestGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: LabProject | null;
  onInjectAndRun: (testSuite: GeneratedTestSuite) => void;
}

export function TestGeneratorModal({
  isOpen,
  onClose,
  project,
  onInjectAndRun,
}: TestGeneratorModalProps) {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  const testSuite = useMemo(() => {
    if (!project) return null;
    return generateProjectTestSuite(project);
  }, [project]);

  if (!isOpen || !project || !testSuite) return null;

  const currentFile = testSuite.files[selectedFileIdx] || testSuite.files[0];

  const handleCopy = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorer
    }
  };

  const handleApply = () => {
    setIsInjecting(true);
    onInjectAndRun(testSuite);
    setTimeout(() => {
      setIsInjecting(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[84vh] max-h-[700px] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Générateur de Tests Automatisés</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  Vitest & Playwright
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Création instantanée de tests unitaires, d'intégration UI et de scénarios E2E.
              </p>
            </div>
          </div>

          <ModalCloseButton onClick={onClose} label="Fermer" title="Fermer" />
        </div>

        {/* Métriques d'analyse rapide */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/40 grid grid-cols-3 gap-4 shrink-0 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Composants analysés</span>
            <span className="font-bold text-cyan-400 font-mono">{testSuite.summary.componentsCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Assertions générées</span>
            <span className="font-bold text-emerald-400 font-mono">{testSuite.summary.testCasesCount} cas</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400">Fichiers créés</span>
            <span className="font-bold text-purple-400 font-mono">{testSuite.files.length} fichiers</span>
          </div>
        </div>

        {/* Explorateur & Prévisualisation */}
        <div className="flex-1 flex overflow-hidden">
          {/* Liste des fichiers générés */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/40 p-3 space-y-1 overflow-y-auto scrollbar-thin shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-2">
              Fichiers de Test Générés
            </span>
            {testSuite.files.map((file, idx) => {
              const isSelected = idx === selectedFileIdx;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <FileCode size={14} className={isSelected ? 'text-emerald-400' : 'text-slate-500'} />
                  <span className="truncate">{file.name}</span>
                </button>
              );
            })}
          </div>

          {/* Prévisualisation du code */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            <div className="px-6 py-2 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs shrink-0">
              <span className="font-mono text-slate-300">{currentFile?.path}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>

            <pre className="flex-1 p-6 overflow-auto text-xs font-mono text-emerald-300 leading-relaxed scrollbar-thin selection:bg-emerald-500 selection:text-black">
              {currentFile?.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>Compatible avec le terminal virtuel in-browser (npm test).</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isInjecting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Terminal size={14} />
              <span>{isInjecting ? 'Injection en cours...' : 'Injecter & Lancer les Tests'}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
