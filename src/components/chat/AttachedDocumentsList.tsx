import { memo } from 'react';
import {
  FileText,
  FileCode2,
  Table,
  Archive,
  File,
  X,
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
  if (!documents || documents.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 mb-2 animate-in fade-in duration-200">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="group relative flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-xl bg-slate-900/80 dark:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/40 shadow-sm backdrop-blur-md transition-all text-xs"
        >
          {getDocumentIcon(doc.category)}
          <div className="flex flex-col min-w-0 pr-1">
            <span
              className="font-medium text-slate-200 truncate max-w-[160px] sm:max-w-[220px]"
              title={doc.name}
            >
              {doc.name}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
              <span>{formatFileSize(doc.size)}</span>
              {doc.pageCount && <span>• {doc.pageCount} p.</span>}
              <span className="uppercase text-[9px] px-1 rounded bg-slate-700/60 text-slate-300">
                {doc.extension}
              </span>
            </span>
          </div>

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
      ))}
    </div>
  );
});
