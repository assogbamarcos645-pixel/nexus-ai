/**
 * src/types/ai.ts
 *
 * Types et interfaces pour le Centre de Contrôle IA de NEXUS AI :
 * Gestion des fournisseurs, modèles, métriques d'utilisation, paramètres avancés et état des services.
 */

export type AIProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'mistral'
  | 'groq'
  | 'ollama'
  | 'demo';

export type AIProviderCapability =
  | 'chat'
  | 'code'
  | 'vision'
  | 'streaming'
  | 'function_calling'
  | 'long_context'
  | 'reasoning'
  | 'local_offline';

export interface AIModelPricing {
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: AIProviderCapability[];
  pricing?: AIModelPricing;
  recommendedFor: string;
}

export interface AIProvider {
  id: AIProviderId;
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  docsUrl: string;
  badgeColor: string;
  requiresApiKey: boolean;
  keyEnvironmentVariable: string;
  requiresEndpoint: boolean;
  defaultEndpoint?: string;
  supportedCapabilities: AIProviderCapability[];
  models: AIModel[];
  defaultModelId: string;
  isAvailable?: boolean;
  unavailableReason?: string;
}

export type AIEngineStatus =
  | 'not_configured'
  | 'operational'
  | 'unavailable'
  | 'testing';

export interface AIExperimentalFeatures {
  streaming: boolean;
  reasoningEffort: boolean;
  visionMultimodal: boolean;
  toolCalling: boolean;
}

export interface AIAdvancedSettings {
  maxTokens: number; // 128 - 8192
  temperature: number; // 0.0 - 2.0
  timeoutSeconds: number; // 5 - 120
  experimentalFeatures: AIExperimentalFeatures;
  isDemoMode: boolean;
}

export interface AITokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AITelemetryLog {
  id: string;
  timestamp: string; // ISO 8601
  providerId: AIProviderId;
  modelId: string;
  agentId: string;
  durationMs: number;
  success: boolean;
  statusCode?: number;
  error?: string; // Strictly sanitized, never contains API keys or raw private prompts
  tokens?: AITokenUsage;
  estimatedCostUsd?: number;
  isSimulated: boolean;
}

export interface AIUsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedTotalCostUsd: number | null;
  hasRealData: boolean;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
}

export type ServiceHealthStatus =
  | 'operational'
  | 'not_configured'
  | 'unavailable'
  | 'degraded'
  | 'testing';

export interface AIServiceHealth {
  id: string;
  name: string;
  category: 'ai_engine' | 'cloud_database' | 'cloud_auth' | 'local_storage';
  status: ServiceHealthStatus;
  detail: string;
  latencyMs?: number;
  lastChecked: string;
}

export interface ConnectionTestResult {
  providerId: AIProviderId;
  success: boolean;
  message: string;
  latencyMs: number;
  timestamp: string;
  maskedKeyHint?: string; // e.g. "sk-...4a2b" (never the full secret key)
}

export interface AIControlCenterConfig {
  activeProviderId: AIProviderId;
  activeModelId: string;
  settings: AIAdvancedSettings;
  lastTestResult?: ConnectionTestResult;
}
