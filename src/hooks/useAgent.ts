import { useState, useCallback, useEffect } from 'react';
import { AGENTS } from '@/config/agents';
import type { Agent } from '@/types';

/**
 * Hook to manage the currently selected AI agent.
 * Automatically synchronizes with the active conversation's agent while allowing manual selection.
 */
export function useAgent(defaultAgentId = 'general') {
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgentId);

  // Synchronise automatiquement l'agent actif lors du changement de conversation
  useEffect(() => {
    if (defaultAgentId) {
      setSelectedAgentId(defaultAgentId);
    }
  }, [defaultAgentId]);

  const selectedAgent: Agent =
    AGENTS.find((a) => a.id === selectedAgentId) ?? AGENTS[0];

  const selectAgent = useCallback((id: string) => {
    setSelectedAgentId(id);
  }, []);

  return {
    agents: AGENTS,
    selectedAgent,
    selectedAgentId,
    selectAgent,
  };
}
