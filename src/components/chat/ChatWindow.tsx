import { useEffect, useRef } from 'react';
import { AGENTS } from '@/config/agents';
import { MessageBubble } from './MessageBubble';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatInput } from './ChatInput';
import { Spinner } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { Conversation, Agent } from '@/types';

interface ChatWindowProps {
  conversation: Conversation | null;
  onSuggestionClick: (text: string) => void;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isLoading: boolean;
  error: string | null;
  onToggleSidebar?: () => void;
  agents?: Agent[];
  selectedAgentId?: string;
  onSelectAgent?: (id: string) => void;
  attachedImages?: string[];
  onAddImage?: (dataUrl: string) => void;
  onRemoveImage?: (index: number) => void;
}

export function ChatWindow({
  conversation,
  onSuggestionClick,
  input,
  onInputChange,
  onSend,
  onStop,
  isLoading,
  error,
  agents = AGENTS,
  selectedAgentId,
  onSelectAgent,
  attachedImages,
  onAddImage,
  onRemoveImage,
}: ChatWindowProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeAgentId = selectedAgentId ?? conversation?.agentId ?? 'general';
  const agent = agents.find((a) => a.id === activeAgentId) ?? AGENTS[0];

  const { language } = useTranslation();
  const currentMessages = conversation?.messages ?? [];
  const isEmpty = currentMessages.length === 0;

  // Défilement automatique vers le bas strictement confiné au conteneur de messages
  useEffect(() => {
    if (!isEmpty && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [currentMessages.length, isLoading, isEmpty]);

  // Protection absolue contre tout défilement parasite des conteneurs parents
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollTop !== 0) mainEl.scrollTop = 0;
    const appRoot = document.getElementById('app-root');
    if (appRoot && appRoot.scrollTop !== 0) appRoot.scrollTop = 0;
  }, [currentMessages.length]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden relative">
      {isEmpty ? (
        /* État initial d'accueil (comme ChatGPT et Claude) : Centré verticalement avec marge haute garantie */
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto scrollbar-thin px-3 sm:px-6"
        >
          <div className="min-h-full flex flex-col items-center justify-center py-6 sm:py-10">
            <WelcomeScreen agent={agent} onSuggestionClick={onSuggestionClick}>
              <ChatInput
                value={input}
                onChange={onInputChange}
                onSend={onSend}
                onStop={onStop}
                isLoading={isLoading}
                error={error}
                agents={agents}
                selectedAgentId={agent.id}
                onSelectAgent={onSelectAgent}
                attachedImages={attachedImages}
                onAddImage={onAddImage}
                onRemoveImage={onRemoveImage}
                centered
              />
            </WelcomeScreen>
          </div>
        </div>
      ) : (
        /* Fil de discussion actif : Les messages défilent, la zone de saisie reste fermement calée en bas */
        <>
          <div
            id="messages-container"
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto scrollbar-thin px-2 sm:px-4 py-4 sm:py-6"
          >
            {/* Fil de messages épuré sans avatar ni profil */}
            <div className="max-w-3xl mx-auto w-full space-y-3 pt-2">
              {currentMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} agent={agent} />
              ))}

              {isLoading && (
                <div className="flex items-center justify-start px-4 py-2 max-w-3xl mx-auto w-full">
                  <div className="bg-white dark:bg-[#0f1422]/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 shadow-[0_4px_20px_rgba(15,23,42,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
                    <Spinner size="sm" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Barre de saisie fixée en bas (Style Deep Slate & Cobalt) */}
          <div className="shrink-0 w-full bg-gradient-to-t from-[#f8fafc]/95 via-[#f8fafc]/70 to-transparent dark:from-[#0b0f19]/95 dark:via-[#0b0f19]/70 dark:to-transparent backdrop-blur-[2px] pt-1">
            <ChatInput
              value={input}
              onChange={onInputChange}
              onSend={onSend}
              onStop={onStop}
              isLoading={isLoading}
              error={error}
              agents={agents}
              selectedAgentId={agent.id}
              onSelectAgent={onSelectAgent}
              attachedImages={attachedImages}
              onAddImage={onAddImage}
              onRemoveImage={onRemoveImage}
            />
            <p className="text-[11px] text-center text-slate-400 dark:text-white/30 pt-1 pb-1.5 select-none px-4">
              {language === 'fr'
                ? 'NEXUS AI peut commettre des erreurs. Pensez à vérifier les informations importantes.'
                : 'NEXUS AI can make mistakes. Consider verifying important information.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
