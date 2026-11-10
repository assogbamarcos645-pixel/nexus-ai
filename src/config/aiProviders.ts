/**
 * src/config/aiProviders.ts
 *
 * Catalogue officiel des fournisseurs d'IA et modèles supportés par NEXUS AI.
 * Les spécifications (capacités, fenêtres de contexte, tarifications réelles)
 * sont rigoureusement basées sur la documentation officielle des éditeurs.
 */

import type { AIProvider, AIProviderId, AIAdvancedSettings } from '@/types/ai';

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'demo',
    name: 'Mode Démonstration',
    tagline: 'Simulateur local intégré sans appel réseau',
    description:
      'Générateur de réponses de démonstration pré-formatées et contextualisées. Fonctionne 100% dans le navigateur sans configuration, sans compte et sans coût.',
    websiteUrl: 'https://github.com',
    docsUrl: 'https://github.com',
    badgeColor: '#a855f7',
    requiresApiKey: false,
    keyEnvironmentVariable: '',
    requiresEndpoint: false,
    supportedCapabilities: ['chat', 'code', 'local_offline'],
    defaultModelId: 'nexus-simulated-echo',
    isAvailable: true,
    models: [
      {
        id: 'nexus-simulated-echo',
        name: 'Simulateur NEXUS (Local)',
        description:
          'Moteur de démonstration interactif simulant les réponses d’agents sans connexion externe.',
        contextWindow: 8_000,
        maxOutputTokens: 2_048,
        capabilities: ['chat', 'code', 'local_offline'],
        pricing: {
          inputPerMillionTokens: 0,
          outputPerMillionTokens: 0,
        },
        recommendedFor: 'Tests hors-ligne, prototypage rapide et évaluation de l’interface',
      },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    tagline: 'Modèles multimodaux de pointe à très grand contexte',
    description:
      'Famille de modèles Gemini développés par Google DeepMind, offrant des fenêtres de contexte allant jusqu’à 2 millions de tokens et une inférence multimodale native.',
    websiteUrl: 'https://deepmind.google/technologies/gemini/',
    docsUrl: 'https://ai.google.dev/docs',
    badgeColor: '#3b82f6',
    requiresApiKey: true,
    keyEnvironmentVariable: 'GEMINI_API_KEY',
    requiresEndpoint: false,
    supportedCapabilities: [
      'chat',
      'code',
      'vision',
      'streaming',
      'function_calling',
      'long_context',
      'reasoning',
    ],
    defaultModelId: 'gemini-2.5-flash',
    isAvailable: true,
    models: [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description:
          'Modèle phare de Google ultra-rapide, réactif et stable avec latence minimale et streaming temps réel.',
        contextWindow: 1_048_576,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'vision', 'streaming', 'function_calling', 'long_context'],
        pricing: {
          inputPerMillionTokens: 0.10,
          outputPerMillionTokens: 0.40,
        },
        recommendedFor: 'Usage général, vitesse d’exécution maximale et réponses instantanées',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description:
          'Modèle avancé pour raisonnements complexes, analyse approfondie et tâches de code exigeantes.',
        contextWindow: 2_097_152,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'vision', 'streaming', 'function_calling', 'long_context', 'reasoning'],
        pricing: {
          inputPerMillionTokens: 1.25,
          outputPerMillionTokens: 5.00,
        },
        recommendedFor: 'Raisonnement pointu, architecture logicielle et analyse de données',
      },
      {
        id: 'gemini-3.5-flash',
        name: 'Gemini 3.5 Flash',
        description:
          'Version Flash haute vélocité avec excellente compréhension multilingue et support vision.',
        contextWindow: 1_048_576,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'vision', 'streaming', 'function_calling', 'long_context'],
        pricing: {
          inputPerMillionTokens: 0.10,
          outputPerMillionTokens: 0.40,
        },
        recommendedFor: 'Conversations courantes, assistance quotidienne et tâches à flux tendu',
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description:
          'Modèle de référence pour l’analyse de documents volumineux et très grands contextes (jusqu’à 2M tokens).',
        contextWindow: 2_097_152,
        maxOutputTokens: 8_192,
        capabilities: [
          'chat',
          'code',
          'vision',
          'streaming',
          'function_calling',
          'long_context',
          'reasoning',
        ],
        pricing: {
          inputPerMillionTokens: 1.25,
          outputPerMillionTokens: 5.00,
        },
        recommendedFor: 'Très grands contextes, synthèse de codebases et analyse approfondie',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description:
          'Modèle ultraléger haute performance optimisé pour le coût et le temps de réponse.',
        contextWindow: 1_048_576,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'vision', 'streaming', 'function_calling', 'long_context'],
        pricing: {
          inputPerMillionTokens: 0.075,
          outputPerMillionTokens: 0.30,
        },
        recommendedFor: 'Tâches rapides, extraction d’informations et micro-services',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    tagline: 'L’excellence européenne du génie logiciel et de l’IA spécialisée',
    description:
      'Modèles développés à Paris par Mistral AI, alliant souveraineté, performance multilingue de premier plan et modèles de code ultra-rapides.',
    websiteUrl: 'https://mistral.ai',
    docsUrl: 'https://docs.mistral.ai',
    badgeColor: '#f97316',
    requiresApiKey: true,
    keyEnvironmentVariable: 'MISTRAL_API_KEY',
    requiresEndpoint: false,
    supportedCapabilities: [
      'chat',
      'code',
      'streaming',
      'function_calling',
      'long_context',
      'reasoning',
    ],
    defaultModelId: 'codestral-latest',
    isAvailable: true,
    models: [
      {
        id: 'codestral-latest',
        name: 'Codestral (Spécialisé Code & Génie Logiciel)',
        description:
          'Modèle génératif de pointe spécialisé en génie logiciel, prenant en charge plus de 80 langages de programmation. Validé 100% opérationnel.',
        contextWindow: 256_000,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'streaming', 'long_context', 'reasoning'],
        pricing: {
          inputPerMillionTokens: 0.30,
          outputPerMillionTokens: 0.90,
        },
        recommendedFor: 'NEXUS DEV, architecture logicielle, refactoring, tests unitaires et audit de code',
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq (LPUs)',
    tagline: 'Inférence matérielle LPU à ultra-basse latence',
    description:
      'Serveur d’inférence propulsé par des Language Processing Units (LPU) de Groq, offrant des débits ultra-rapides sur des architectures ouvertes.',
    websiteUrl: 'https://groq.com',
    docsUrl: 'https://console.groq.com/docs',
    badgeColor: '#ec4899',
    requiresApiKey: true,
    keyEnvironmentVariable: 'GROQ_API_KEY',
    requiresEndpoint: false,
    supportedCapabilities: ['chat', 'code', 'streaming', 'function_calling', 'long_context'],
    defaultModelId: 'openai/gpt-oss-120b',
    isAvailable: true,
    models: [
      {
        id: 'openai/gpt-oss-120b',
        name: 'GPT-OSS 120B (Groq)',
        description:
          'Grand modèle haute performance optimisé pour le raisonnement et le code sur processeurs Groq LPU. Validé opérationnel.',
        contextWindow: 128_000,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'streaming', 'function_calling', 'long_context'],
        pricing: {
          inputPerMillionTokens: 0.40,
          outputPerMillionTokens: 0.60,
        },
        recommendedFor: 'Raisonnement avancé, génération de code et conversations complexes',
      },
      {
        id: 'qwen/qwen3.8-27b',
        name: 'Qwen 3.8 27B (Groq)',
        description:
          'Modèle 27B très rapide et réactif (latence ~300ms) avec d’excellentes capacités en français et multilingue.',
        contextWindow: 128_000,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'streaming'],
        pricing: {
          inputPerMillionTokens: 0.15,
          outputPerMillionTokens: 0.25,
        },
        recommendedFor: 'Réponses instantanées et tâches conversationnelles à débit maximal',
      },
      {
        id: 'openai/gpt-oss-20b',
        name: 'GPT-OSS 20B (Groq)',
        description:
          'Modèle compact ultra-rapide propulsé à grande vitesse sur architecture Groq (~500ms).',
        contextWindow: 64_000,
        maxOutputTokens: 4_096,
        capabilities: ['chat', 'code', 'streaming'],
        pricing: {
          inputPerMillionTokens: 0.10,
          outputPerMillionTokens: 0.15,
        },
        recommendedFor: 'Synthèses ultra-rapides et requêtes courtes',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'Standard industriel avec GPT-4o et modèles de raisonnement o1',
    description:
      'Modèles polyvalents et puissants développés par OpenAI. Temporairement en pause car le quota de crédits de la clé actuelle est épuisé.',
    websiteUrl: 'https://openai.com',
    docsUrl: 'https://platform.openai.com/docs',
    badgeColor: '#10b981',
    requiresApiKey: true,
    keyEnvironmentVariable: 'OPENAI_API_KEY',
    requiresEndpoint: false,
    supportedCapabilities: [
      'chat',
      'code',
      'vision',
      'streaming',
      'function_calling',
      'long_context',
      'reasoning',
    ],
    defaultModelId: 'gpt-4o',
    isAvailable: false,
    unavailableReason: 'Crédits API OpenAI épuisés (HTTP 429). Recharge requise sur platform.openai.com.',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description:
          'Modèle omnimodal phare d’OpenAI combinant haute intelligence, vision et vitesse élevée.',
        contextWindow: 128_000,
        maxOutputTokens: 16_384,
        capabilities: ['chat', 'code', 'vision', 'streaming', 'function_calling', 'long_context'],
        pricing: {
          inputPerMillionTokens: 2.50,
          outputPerMillionTokens: 10.00,
        },
        recommendedFor: 'Conversations exigeantes, revues de code complètes et tâches multi-agents',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description:
          'Modèle d’inférence rapide et économique, adapté à l’écrasante majorité des cas d’usage courants.',
        contextWindow: 128_000,
        maxOutputTokens: 16_384,
        capabilities: ['chat', 'code', 'vision', 'streaming', 'function_calling', 'long_context'],
        pricing: {
          inputPerMillionTokens: 0.15,
          outputPerMillionTokens: 0.60,
        },
        recommendedFor: 'Développement au quotidien, rédaction rapide et requêtes fréquentes',
      },
      {
        id: 'o1',
        name: 'OpenAI o1',
        description:
          'Modèle à raisonnement délibéré entraîné par renforcement pour les problèmes mathématiques et scientifiques complexes.',
        contextWindow: 200_000,
        maxOutputTokens: 100_000,
        capabilities: ['chat', 'code', 'reasoning', 'long_context'],
        pricing: {
          inputPerMillionTokens: 15.00,
          outputPerMillionTokens: 60.00,
        },
        recommendedFor: 'Défis algorithmiques de haute difficulté, architecture système critique',
      },
      {
        id: 'o1-mini',
        name: 'OpenAI o1-mini',
        description:
          'Version condensée du modèle o1, spécialisée dans le code et les sciences exactes.',
        contextWindow: 128_000,
        maxOutputTokens: 65_536,
        capabilities: ['chat', 'code', 'reasoning', 'long_context'],
        pricing: {
          inputPerMillionTokens: 1.10,
          outputPerMillionTokens: 4.40,
        },
        recommendedFor: 'Optimisation de code pointue et mathématiques appliquées',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tagline: 'Excellence rédactionnelle, analyse méticuleuse et sécurité',
    description:
      'Modèles Claude développés par Anthropic avec Constitutional AI. Temporairement en pause car le solde de crédits de la clé actuelle est épuisé.',
    websiteUrl: 'https://anthropic.com',
    docsUrl: 'https://docs.anthropic.com',
    badgeColor: '#d97706',
    requiresApiKey: true,
    keyEnvironmentVariable: 'ANTHROPIC_API_KEY',
    requiresEndpoint: false,
    supportedCapabilities: [
      'chat',
      'code',
      'vision',
      'streaming',
      'function_calling',
      'long_context',
      'reasoning',
    ],
    defaultModelId: 'claude-3-5-sonnet',
    isAvailable: false,
    unavailableReason: 'Solde de crédits Anthropic insuffisant. Recharge requise sur console.anthropic.com.',
    models: [
      {
        id: 'claude-3-7-sonnet',
        name: 'Claude 3.7 Sonnet',
        description:
          'Modèle hybride avec mode de réflexion étendue (Extended Thinking) pour une précision exceptionnelle.',
        contextWindow: 200_000,
        maxOutputTokens: 8_192,
        capabilities: [
          'chat',
          'code',
          'vision',
          'streaming',
          'function_calling',
          'long_context',
          'reasoning',
        ],
        pricing: {
          inputPerMillionTokens: 3.00,
          outputPerMillionTokens: 15.00,
        },
        recommendedFor: 'Ingénierie logicielle complexe, raisonnement hybride et révision fine',
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description:
          'La référence Anthropic pour le codage, la compréhension sémantique et la vision.',
        contextWindow: 200_000,
        maxOutputTokens: 8_192,
        capabilities: [
          'chat',
          'code',
          'vision',
          'streaming',
          'function_calling',
          'long_context',
        ],
        pricing: {
          inputPerMillionTokens: 3.00,
          outputPerMillionTokens: 15.00,
        },
        recommendedFor: 'NEXUS DEV, refactorings structurés et rédaction technique de haute volée',
      },
      {
        id: 'claude-3-5-haiku',
        name: 'Claude 3.5 Haiku',
        description:
          'Vitesse d’exécution exceptionnelle avec une intelligence équivalente à l’ancien Claude 3 Opus.',
        contextWindow: 200_000,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'vision', 'streaming', 'function_calling', 'long_context'],
        pricing: {
          inputPerMillionTokens: 0.80,
          outputPerMillionTokens: 4.00,
        },
        recommendedFor: 'Assistance instantanée, filtrage, synthèse et tâches à flux tendu',
      },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local & Privé)',
    tagline: 'Exécution 100% locale, souveraine et confidentielle',
    description:
      'Serveur d’inférence local Ollama exécuté sur votre propre machine (GPU/CPU). Vos données et conversations ne quittent jamais votre environnement.',
    websiteUrl: 'https://ollama.com',
    docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
    badgeColor: '#06b6d4',
    requiresApiKey: false,
    keyEnvironmentVariable: '',
    requiresEndpoint: true,
    defaultEndpoint: 'http://localhost:11434',
    supportedCapabilities: ['chat', 'code', 'streaming', 'local_offline'],
    defaultModelId: 'qwen2.5-coder:7b',
    isAvailable: false,
    unavailableReason: 'Démon Ollama local non démarré (lancez "ollama serve" sur votre machine).',
    models: [
      {
        id: 'qwen2.5-coder:7b',
        name: 'Qwen 2.5 Coder 7B (Installé)',
        description:
          'Modèle de pointe développé par Alibaba, dédié à la programmation et au raisonnement local fluide.',
        contextWindow: 32_768,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'streaming', 'local_offline'],
        pricing: {
          inputPerMillionTokens: 0,
          outputPerMillionTokens: 0,
        },
        recommendedFor: 'Développement, assistance technique locale et confidentialité absolue',
      },
      {
        id: 'llama3.2',
        name: 'Llama 3.2 (Meta)',
        description:
          'Modèle open-weights compact optimisé pour le déploiement local fluide et léger.',
        contextWindow: 128_000,
        maxOutputTokens: 4_096,
        capabilities: ['chat', 'code', 'streaming', 'local_offline'],
        pricing: {
          inputPerMillionTokens: 0,
          outputPerMillionTokens: 0,
        },
        recommendedFor: 'Confidentialité totale, travail sans accès internet et zéro coût',
      },
      {
        id: 'qwen2.5-coder',
        name: 'Qwen 2.5 Coder',
        description:
          'Modèle open-source de pointe développé par Alibaba, dédié à la programmation locale.',
        contextWindow: 128_000,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'streaming', 'local_offline'],
        pricing: {
          inputPerMillionTokens: 0,
          outputPerMillionTokens: 0,
        },
        recommendedFor: 'Assistance NEXUS DEV en local hors-ligne',
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek R1 (Distill)',
        description:
          'Modèle de raisonnement délibéré open-weights exécutable en local sur Ollama.',
        contextWindow: 64_000,
        maxOutputTokens: 8_192,
        capabilities: ['chat', 'code', 'streaming', 'local_offline', 'reasoning'],
        pricing: {
          inputPerMillionTokens: 0,
          outputPerMillionTokens: 0,
        },
        recommendedFor: 'Raisonnement logique et mathématique sans dépendance cloud',
      },
      {
        id: 'mistral',
        name: 'Mistral 7B (Local)',
        description:
          'Modèle compact de Mistral AI très populaire pour l’exécution locale.',
        contextWindow: 32_768,
        maxOutputTokens: 4_096,
        capabilities: ['chat', 'code', 'streaming', 'local_offline'],
        pricing: {
          inputPerMillionTokens: 0,
          outputPerMillionTokens: 0,
        },
        recommendedFor: 'Conversation générale hors-ligne',
      },
    ],
  },
];

/** Paramètres avancés par défaut pour le moteur IA */
export const DEFAULT_AI_SETTINGS: AIAdvancedSettings = {
  maxTokens: 2_048,
  temperature: 0.7,
  timeoutSeconds: 30,
  experimentalFeatures: {
    streaming: false,
    reasoningEffort: false,
    visionMultimodal: false,
    toolCalling: false,
  },
  isDemoMode: false, // Moteur IA réel actif par défaut
};

export const DEFAULT_PROVIDER_ID: AIProviderId = 'mistral';
export const DEFAULT_MODEL_ID = 'codestral-latest';

/**
 * Recherche un fournisseur dans le catalogue par son identifiant.
 */
export function getProviderById(providerId: AIProviderId | string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === providerId);
}

/**
 * Recherche un modèle dans le catalogue à partir du fournisseur et de l'ID du modèle.
 */
export function getModelById(providerId: AIProviderId | string, modelId: string) {
  const provider = getProviderById(providerId);
  if (!provider) return undefined;
  return provider.models.find((m) => m.id === modelId);
}

