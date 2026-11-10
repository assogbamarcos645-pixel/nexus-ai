import { useState, useCallback } from 'react';
import { AGENTS } from '@/config/agents';
import type { Agent } from '@/types';

/**
 * Hook to manage the currently selected AI agent.
 * When a real LLM API is connected, switch agents by changing their systemPrompt.
 */
export function useAgent(defaultAgentId = 'general') {
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgentId);

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
