import {
  Sparkles,
  Code2,
  PenLine,
  BarChart3,
  BookOpen,
  Layers,
  FileCode,
  Gauge,
  ShieldCheck,
  Cpu,
  Terminal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Code2,
  PenLine,
  BarChart3,
  BookOpen,
  Layers,
  FileCode,
  Gauge,
  ShieldCheck,
  Cpu,
  Terminal,
};

interface AgentIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function AgentIcon({ name, size = 18, className, style }: AgentIconProps) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon size={size} className={className} style={style} />;
}
