/**
 * src/services/admin/adminGatewayService.ts
 *
 * Passerelle IA & Routage Dynamique (AI Gateway) :
 * - Selection du provider principal et ordre de bascule (fallback)
 * - Matrice des permissions de modeles par role
 * - Guardrails et moderation (Anti-injections, Masquage PII / Secrets)
 */

import type { GatewayConfig, RoleModelPermissions, GuardrailConfig } from '../../types/admin.ts';
import { logAdminAudit } from './adminSecurityService.ts';

const GATEWAY_STORAGE_KEY = 'nexus_admin_gateway_v1';

export const AVAILABLE_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-4o', latencyMs: 240, status: 'operational' },
  { id: 'anthropic', name: 'Anthropic', defaultModel: 'claude-3-5-sonnet-20241022', latencyMs: 290, status: 'operational' },
  { id: 'google', name: 'Google Gemini', defaultModel: 'gemini-1.5-pro', latencyMs: 185, status: 'operational' },
  { id: 'groq', name: 'Groq LPU', defaultModel: 'llama-3.3-70b-versatile', latencyMs: 82, status: 'operational' },
  { id: 'ollama', name: 'Ollama Local Host', defaultModel: 'llama3:latest', latencyMs: 45, status: 'operational' },
];

export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (Omni)', provider: 'OpenAI', tier: 'premium' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', tier: 'economy' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tier: 'premium' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic', tier: 'economy' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', tier: 'premium' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', tier: 'economy' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', provider: 'Groq', tier: 'economy' },
  { id: 'llama3:latest', name: 'Llama 3 Local (Ollama)', provider: 'Ollama', tier: 'local' },
];

export function getDefaultGatewayConfig(): GatewayConfig {
  const allModelIds = AVAILABLE_MODELS.map((m) => m.id);
  const economyModelIds = AVAILABLE_MODELS.filter((m) => m.tier === 'economy' || m.tier === 'local').map((m) => m.id);

  const defaultRolePermissions: RoleModelPermissions = {
    super_admin: allModelIds,
    admin: allModelIds,
    pro_dev: allModelIds,
    user: economyModelIds,
    restricted: ['gemini-1.5-flash', 'llama3:latest'],
  };

  const defaultGuardrails: GuardrailConfig = {
    promptInjectionBlocker: true,
    piiAndSecretMasking: true,
    customBlockedTerms: ['DROP DATABASE', 'eval(', 'rm -rf /', '<script>alert'],
  };

  return {
    primaryProvider: 'openai',
    fallbackEnabled: true,
    latencyThresholdMs: 1500,
    providerOrder: ['openai', 'anthropic', 'google', 'groq', 'ollama'],
    rolePermissions: defaultRolePermissions,
    guardrails: defaultGuardrails,
  };
}

export function getGatewayConfig(): GatewayConfig {
  if (typeof window === 'undefined') return getDefaultGatewayConfig();
  try {
    const raw = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (!raw) return getDefaultGatewayConfig();
    const parsed = JSON.parse(raw);
    return { ...getDefaultGatewayConfig(), ...parsed };
  } catch {
    return getDefaultGatewayConfig();
  }
}

export function saveGatewayConfig(config: GatewayConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('nexus:gateway-config-updated', { detail: config }));
    logAdminAudit('gateway_update', true, 'Mise a jour de la Passerelle IA et des regles de routage');
  } catch (err) {
    console.error('[AdminGatewayService] Erreur sauvegarde:', err);
  }
}

export function updateProviderOrder(newOrder: string[]): void {
  const current = getGatewayConfig();
  saveGatewayConfig({ ...current, providerOrder: newOrder });
}

export function toggleRoleModelPermission(role: keyof RoleModelPermissions, modelId: string): void {
  const current = getGatewayConfig();
  const currentList = current.rolePermissions[role] || [];
  const exists = currentList.includes(modelId);
  const updatedList = exists ? currentList.filter((m) => m !== modelId) : [...currentList, modelId];

  saveGatewayConfig({
    ...current,
    rolePermissions: {
      ...current.rolePermissions,
      [role]: updatedList,
    },
  });
}

export function updateGuardrails(guardrails: Partial<GuardrailConfig>): void {
  const current = getGatewayConfig();
  saveGatewayConfig({
    ...current,
    guardrails: { ...current.guardrails, ...guardrails },
  });
}
