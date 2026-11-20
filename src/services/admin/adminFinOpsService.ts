/**
 * src/services/admin/adminFinOpsService.ts
 *
 * FinOps & Plafonds Budgetaires (Cost Control) :
 * - Jauge de budget mensuel strict (ex. 100 $/mois)
 * - Comportement au depassement (coupure dure vs repli sur modeles gratuits/locaux)
 * - Alertes par seuils (75%, 90%, 100%)
 * - Ventilation des couts : Chat vs Lab vs Agents specialises
 */

import type { FinOpsConfig, CostBreakdownItem } from '../../types/admin.ts';
import { logAdminAudit } from './adminSecurityService.ts';

const FINOPS_STORAGE_KEY = 'nexus_admin_finops_v1';

export function getDefaultFinOpsConfig(): FinOpsConfig {
  const breakdown: CostBreakdownItem[] = [
    {
      id: 'chat',
      label: 'Chat Conversationnel',
      amountUsd: 14.85,
      percentage: 54,
      tokens: 1850000,
      color: '#3b82f6',
    },
    {
      id: 'lab',
      label: 'Nexus Lab (Studio Code & Sandbox)',
      amountUsd: 8.6,
      percentage: 31,
      tokens: 920000,
      color: '#8b5cf6',
    },
    {
      id: 'agents',
      label: 'Agents Specialises & Audit',
      amountUsd: 4.15,
      percentage: 15,
      tokens: 450000,
      color: '#10b981',
    },
  ];

  return {
    monthlyBudgetUsd: 100,
    onLimitExceeded: 'fallback_free',
    alertThresholds: [75, 90, 100],
    currentSpendUsd: 27.6,
    breakdown,
  };
}

export function getFinOpsConfig(): FinOpsConfig {
  if (typeof window === 'undefined') return getDefaultFinOpsConfig();
  try {
    const raw = localStorage.getItem(FINOPS_STORAGE_KEY);
    if (!raw) return getDefaultFinOpsConfig();
    const parsed = JSON.parse(raw);
    return { ...getDefaultFinOpsConfig(), ...parsed };
  } catch {
    return getDefaultFinOpsConfig();
  }
}

export function saveFinOpsConfig(config: FinOpsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FINOPS_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('nexus:finops-config-updated', { detail: config }));
    logAdminAudit('finops_update', true, `Mise a jour du budget FinOps : ${config.monthlyBudgetUsd} $/mois`);
  } catch (err) {
    console.error('[AdminFinOpsService] Erreur sauvegarde:', err);
  }
}

export function updateBudgetLimit(budgetUsd: number): void {
  const current = getFinOpsConfig();
  saveFinOpsConfig({ ...current, monthlyBudgetUsd: Math.max(1, budgetUsd) });
}

export function updateOnLimitAction(action: FinOpsConfig['onLimitExceeded']): void {
  const current = getFinOpsConfig();
  saveFinOpsConfig({ ...current, onLimitExceeded: action });
}

export function toggleAlertThreshold(threshold: number): void {
  const current = getFinOpsConfig();
  const exists = current.alertThresholds.includes(threshold);
  const updated = exists
    ? current.alertThresholds.filter((t) => t !== threshold)
    : [...current.alertThresholds, threshold].sort((a, b) => a - b);
  saveFinOpsConfig({ ...current, alertThresholds: updated });
}
