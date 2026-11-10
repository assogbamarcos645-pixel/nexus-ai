
import { useState, useEffect, lazy, Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useAgent } from '@/hooks/useAgent';
import { useChatEngine } from '@/hooks/useChatEngine';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { AppHeader, type ActiveAppView } from '@/components/navigation/AppHeader';
import { AuthProvider } from '@/context/AuthContext';
import { SyncProvider } from '@/context/SyncContext';
import { I18nProvider } from '@/i18n/I18nContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LocalDataImportBanner } from '@/components/auth/LocalDataImportBanner';
import { EmailConfirmationToast } from '@/components/auth/EmailConfirmationToast';

const NexusLab = lazy(() =>
  import('@/components/lab/NexusLab').then((m) => ({ default: m.NexusLab })),
);

const ControlCenter = lazy(() =>
  import('@/components/control-center/ControlCenter').then((m) => ({
    default: m.ControlCenter,
  })),
);

function WorkspaceFallback({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-transparent text-slate-800 dark:text-white p-8">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center animate-pulse mb-3 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
        <Sparkles size={20} className="text-indigo-600 dark:text-cyan-300" />
      </div>
      <p className="text-xs font-semibold text-slate-700 dark:text-white/80 tracking-wide">{label}</p>
      <p className="text-[11px] text-slate-400 dark:text-white/40 mt-1">Chargement des modules optimisés...</p>
    </div>
  );
}

/**
 * Root application component — wires all hooks, layouts, and workspaces together.
 */
function AppContent() {
  const [activeView, setActiveView] = useState<ActiveAppView>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateMessage,
  } = useConversations();

  const { agents, selectedAgentId, selectAgent } = useAgent(
    activeConversation?.agentId,
  );

  const {
    input,
    setInput,
    attachedImages,
    addAttachedImage,
    removeAttachedImage,
    isLoading,
    sendMessage,
    stopGeneration,
    error,
  } = useChatEngine({
    agentId: selectedAgentId,
    conversationMessages: activeConversation?.messages,
    addMessage,
    updateMessage,
  });

  // Écoute de l'événement global pour basculer vers NEXUS LAB lors de la conversion de maquettes
  useEffect(() => {
    const handleOpenProject = () => {
      setActiveView('lab');
    };
    window.addEventListener('nexus-open-project', handleOpenProject);
    return () => window.removeEventListener('nexus-open-project', handleOpenProject);
  }, []);

  const handleNewConversation = () => {
    createConversation(selectedAgentId);
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    setTimeout(() => {
      const inputEl = document.getElementById('chat-input') as HTMLTextAreaElement | null;
      inputEl?.focus({ preventScroll: true });
    }, 20);
  };

  // When the engine sends, make sure conversation exists
  const handleSend = () => {
    if (!activeConversationId) {
      createConversation(selectedAgentId);
    }
    sendMessage();
  };

  // Restauration automatique et systématique du curseur dans le chat sans déplacement parasite
  useEffect(() => {
    if (activeView === 'chat') {
      const focusChatInput = () => {
        const inputEl = document.getElementById('chat-input') as HTMLTextAreaElement | null;
        if (inputEl && document.activeElement !== inputEl) {
          inputEl.focus({ preventScroll: true });
        }
      };
      focusChatInput();
      const t1 = setTimeout(focusChatInput, 80);
      const t2 = setTimeout(focusChatInput, 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeView, activeConversationId]);

  return (
    <div
      id="app-root"
      className="flex h-[100dvh] min-h-screen w-full overflow-hidden nexus-ambient-grid bg-[#f8fafc] dark:bg-[#0b0f19] dark:bg-gradient-to-br dark:from-[#070a12] dark:via-[#0b0f19] dark:to-[#070a12]"
    >
      {/* Barre latérale gauche fixe sur toute la hauteur */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        activeView={activeView}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        onNavigateView={setActiveView}
        onOpenMemories={() => setIsMemoriesModalOpen(true)}
      />

      {/* Zone de travail principale à droite */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Arrière-plan Cinématique d'Ambiance Haute Définition */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
          aria-hidden="true"
        >
          {/* Image d'ambiance 3D ultra-HD */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 dark:opacity-40 transition-opacity duration-1000"
            style={{ backgroundImage: `url('/nexus-ambient-bg.jpg')` }}
          />
          {/* Masque radial cinématique (vignette pour adoucir les bords) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(248,250,252,0.85)_75%,#f8fafc_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(11,15,25,0.78)_70%,#0b0f19_100%)]" />
          {/* Dégradé vertical pour préserver un contraste parfait sur l'en-tête et le bas */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc]/70 via-transparent to-[#f8fafc]/95 dark:from-[#0b0f19]/80 dark:via-transparent dark:to-[#0b0f19]/95" />
        </div>

        {/* Lueurs ambiantes Cobalt & Deep Slate avec respiration vivante et accentuée */}
        <div
          className="pointer-events-none absolute -top-24 right-10 w-[680px] h-[680px] rounded-full bg-gradient-to-br from-blue-300/40 via-sky-300/30 to-transparent dark:from-blue-600/25 dark:via-sky-500/20 dark:to-transparent blur-[100px] animate-nexus-aurora"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/3 -left-20 w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-sky-300/35 via-blue-300/25 to-transparent dark:from-cyan-500/20 dark:via-blue-800/18 dark:to-transparent blur-[100px] animate-nexus-aurora [animation-delay:-4.5s]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-1/4 w-[520px] h-[520px] rounded-full bg-gradient-to-t from-slate-300/35 to-transparent dark:from-blue-700/18 dark:via-slate-800/25 dark:to-transparent blur-[110px] animate-nexus-aurora [animation-delay:-2.2s]"
          aria-hidden="true"
        />

        {/* En-tête supérieur épuré */}
        <AppHeader
          activeView={activeView}
          onViewChange={setActiveView}
          isAuthOpen={isAuthModalOpen}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onCloseAuth={() => setIsAuthModalOpen(false)}
          isMemoriesOpen={isMemoriesModalOpen}
          onOpenMemories={() => setIsMemoriesModalOpen(true)}
          onCloseMemories={() => setIsMemoriesModalOpen(false)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Bannière d'importation des données locales */}
        <LocalDataImportBanner />

        {/* Notification flottante de confirmation d'e-mail */}
        <EmailConfirmationToast />

        {/* Corps dynamique : Chat, Projets (Lab) ou Explorer (Control Center) */}
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          {activeView === 'chat' ? (
            <ChatWindow
              conversation={activeConversation}
              onSuggestionClick={handleSuggestionClick}
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              onStop={stopGeneration}
              isLoading={isLoading}
              error={error}
              agents={agents}
              selectedAgentId={selectedAgentId}
              onSelectAgent={selectAgent}
              attachedImages={attachedImages}
              onAddImage={addAttachedImage}
              onRemoveImage={removeAttachedImage}
            />
          ) : activeView === 'lab' ? (
            <Suspense fallback={<WorkspaceFallback label="Chargement de NEXUS LAB" />}>
              <NexusLab />
            </Suspense>
          ) : (
            <Suspense fallback={<WorkspaceFallback label="Chargement de l'Explorateur IA" />}>
              <ControlCenter onOpenAuth={() => setIsAuthModalOpen(true)} />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <SyncProvider>
            <AppContent />
          </SyncProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
