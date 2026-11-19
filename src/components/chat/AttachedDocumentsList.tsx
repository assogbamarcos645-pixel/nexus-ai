import { memo, useState } from 'react';
import {
  FileText,
  FileCode2,
  Table,
  Archive,
  File,
  X,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import type { AttachedDocument, DocumentCategory } from '@/types/documents';
import { formatFileSize } from '@/services/documents/documentParserService';

interface AttachedDocumentsListProps {
  documents: AttachedDocument[];
  onRemove: (id: string) => void;
}

function getDocumentIcon(category: DocumentCategory) {
  switch (category) {
    case 'pdf':
      return <FileText size={16} className="text-rose-500 shrink-0" />;
    case 'word':
      return <FileText size={16} className="text-blue-400 shrink-0" />;
    case 'code':
      return <FileCode2 size={16} className="text-cyan-400 shrink-0" />;
    case 'data':
      return <Table size={16} className="text-amber-400 shrink-0" />;
    case 'markdown':
      return <FileText size={16} className="text-emerald-400 shrink-0" />;
    case 'archive':
      return <Archive size={16} className="text-purple-400 shrink-0" />;
    default:
      return <File size={16} className="text-slate-400 shrink-0" />;
  }
}

export const AttachedDocumentsList = memo(function AttachedDocumentsList({
  documents,
  onRemove,
}: AttachedDocumentsListProps) {
  const [previewDoc, setPreviewDoc] = useState<AttachedDocument | null>(null);
  const [copied, setCopied] = useState(false);

  if (!documents || documents.length === 0) return null;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorer
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 px-1 mb-2 animate-in fade-in duration-200">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group relative flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-slate-900/80 dark:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/40 shadow-sm backdrop-blur-md transition-all text-xs"
          >
            {getDocumentIcon(doc.category)}
            <button
              type="button"
              onClick={() => setPreviewDoc(doc)}
              className="flex flex-col min-w-0 pr-1 text-left cursor-pointer hover:opacity-90"
              title="Cliquer pour prévisualiser le texte extrait"
            >
              <span className="font-medium text-slate-200 truncate max-w-[150px] sm:max-w-[210px] group-hover:text-cyan-300 transition-colors">
                {doc.name}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                <span>{formatFileSize(doc.size)}</span>
                {doc.pageCount && <span>• {doc.pageCount} p.</span>}
                <span className="uppercase text-[9px] px-1 rounded bg-slate-700/60 text-slate-300">
                  {doc.extension}
                </span>
              </span>
            </button>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setPreviewDoc(doc)}
                title="Prévisualiser le contenu analysé"
                aria-label={`Prévisualiser ${doc.name}`}
                className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
              >
                <Eye size={13} />
              </button>

              <button
                type="button"
                onClick={() => onRemove(doc.id)}
                title="Retirer ce document"
                aria-label={`Retirer ${doc.name}`}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'aperçu du document extrait */}
      {previewDoc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Entête du modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5 min-w-0">
                {getDocumentIcon(previewDoc.category)}
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-semibold text-slate-100 truncate">
                    {previewDoc.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{formatFileSize(previewDoc.size)}</span>
                    {previewDoc.pageCount && <span>• {previewDoc.pageCount} pages</span>}
                    <span>• {previewDoc.content.length.toLocaleString('fr-FR')} caractères extraits</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(previewDoc.content)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                  title="Copier le texte extrait"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Copié' : 'Copier'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Corps défilable avec texte extrait */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin font-mono text-[12px] leading-relaxed bg-[#0c101d] text-slate-300 whitespace-pre-wrap select-text">
              {previewDoc.content}
            </div>

            {/* Pied de page du modal */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400">
              <span>Prêt pour transmission aux agents IA de NEXUS</span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
