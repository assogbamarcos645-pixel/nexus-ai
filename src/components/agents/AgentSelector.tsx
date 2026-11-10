import { cn } from '@/utils/cn';
import { AgentIcon } from '@/components/ui';
import { useTranslation } from '@/hooks/useTranslation';
import type { Agent } from '@/types';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId: string;
  onSelect: (id: string) => void;
}

export function AgentSelector({ agents, selectedAgentId, onSelect }: AgentSelectorProps) {
  const { t } = useTranslation();

  return (
    <aside
      id="agent-panel"
      aria-label={t('agents.selectorTitle')}
      className="hidden sm:flex flex-col w-16 md:w-20 shrink-0 h-full bg-surface-950/60 border-l border-white/6 backdrop-blur-xl py-4 items-center gap-2"
    >
      <p className="text-[9px] uppercase tracking-widest text-white/25 mb-2">Agents</p>
      {agents.map((agent) => (
        <AgentButton
          key={agent.id}
          agent={agent}
          isSelected={agent.id === selectedAgentId}
          onSelect={onSelect}
        />
      ))}
    </aside>
  );
}

interface AgentButtonProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function AgentButton({ agent, isSelected, onSelect }: AgentButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      id={`agent-btn-${agent.id}`}
      title={agent.name}
      aria-label={`${t('agents.activeAgent')}: ${agent.name}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(agent.id)}
      className={cn(
        'group flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all',
        'border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexus-400',
        isSelected
          ? 'border-opacity-50 shadow-lg'
          : 'border-transparent bg-transparent hover:bg-white/5',
      )}
      style={
        isSelected
          ? {
              backgroundColor: agent.color + '1a',
              borderColor: agent.color + '55',
              boxShadow: `0 0 16px ${agent.color}22`,
            }
          : {}
      }
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg mb-1 transition-transform group-hover:scale-110"
        style={
          isSelected
            ? { backgroundColor: agent.color + '33' }
            : { backgroundColor: 'rgba(255,255,255,0.05)' }
        }
      >
        <AgentIcon
          name={agent.icon}
          size={16}
          className={cn(isSelected ? '' : 'text-white/40 group-hover:text-white/70')}
          style={{ color: isSelected ? agent.color : undefined }}
        />
      </div>
      <span
        className={cn(
          'text-[9px] font-medium truncate max-w-[52px]',
          isSelected ? 'text-white/80' : 'text-white/30 group-hover:text-white/50',
        )}
      >
        {agent.name}
      </span>
    </button>
  );
}
