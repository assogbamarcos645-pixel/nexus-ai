/**
 * src/i18n/types.ts
 *
 * Définitions de types pour le système d'internationalisation de NEXUS AI.
 * Garantit la sécurité de typage à la compilation et facilite l'ajout ultérieur de nouvelles langues.
 */

export type SupportedLanguage = 'fr' | 'en';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flagSymbol: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    flagSymbol: 'FR',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flagSymbol: 'EN',
  },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';
export const LANGUAGE_STORAGE_KEY = 'nexus_language_preference_v1';

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    save: string;
    saved: string;
    cancel: string;
    delete: string;
    confirm: string;
    close: string;
    edit: string;
    rename: string;
    create: string;
    export: string;
    import: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    refresh: string;
    copy: string;
    copied: string;
    offline: string;
    online: string;
    anonymous: string;
    active: string;
    inactive: string;
    status: string;
    all: string;
    none: string;
    back: string;
    next: string;
    actions: string;
    viewDetails: string;
    localNotice: string;
  };
  nav: {
    workspaces: string;
    chat: string;
    chatShort: string;
    lab: string;
    labShort: string;
    controlCenter: string;
    controlCenterShort: string;
    memories: string;
    memoriesShort: string;
    login: string;
    profile: string;
    language: string;
    languageAria: string;
    connectedAs: string;
  };
  chat: {
    newConversation: string;
    searchConversations: string;
    noConversations: string;
    deleteConversationConfirm: string;
    inputPlaceholder: string;
    send: string;
    stop: string;
    suggestionTitle: string;
    welcomeTitle: string;
    welcomeSubtitle: string;
    systemPromptTitle: string;
    disclaimer: string;
    simulatedBadge: string;
    realBadge: string;
    characterCount: string;
    copyMessage: string;
  };
  agents: {
    selectorTitle: string;
    capabilitiesTitle: string;
    activeAgent: string;
    general: {
      name: string;
      description: string;
    };
    coder: {
      name: string;
      description: string;
    };
    writer: {
      name: string;
      description: string;
    };
    analyst: {
      name: string;
      description: string;
    };
    researcher: {
      name: string;
      description: string;
    };
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    recoverTitle: string;
    email: string;
    password: string;
    fullName: string;
    confirmPassword: string;
    loginButton: string;
    signupButton: string;
    recoverButton: string;
    forgotPassword: string;
    noAccount: string;
    hasAccount: string;
    rememberMe: string;
    passwordMismatch: string;
    loginSuccess: string;
    signupSuccess: string;
    logout: string;
    sessionExpired: string;
    authGateTitle: string;
    authGateDesc: string;
  };
  memories: {
    title: string;
    subtitle: string;
    addMemory: string;
    keyLabel: string;
    contentLabel: string;
    categoryLabel: string;
    saveMemory: string;
    deleteConfirm: string;
    noMemories: string;
    categories: {
      all: string;
      preference: string;
      context: string;
      fact: string;
      project: string;
    };
  };
  lab: {
    title: string;
    newProject: string;
    projectName: string;
    chooseTemplate: string;
    exportZip: string;
    explorer: string;
    editor: string;
    preview: string;
    showPreview: string;
    hidePreview: string;
    assistant: string;
    addFile: string;
    deleteFile: string;
    saveFile: string;
    filePath: string;
    runLocal: string;
    serverRequired: string;
    browserPreview: string;
    consoleLogs: string;
    emptyExplorer: string;
  };
  controlCenter: {
    title: string;
    subtitle: string;
    providers: string;
    models: string;
    activeProvider: string;
    activeModel: string;
    testConnection: string;
    testing: string;
    operational: string;
    unavailable: string;
    costEstimate: string;
    tokensUsed: string;
    latency: string;
    advancedSettings: string;
    temperature: string;
    maxTokens: string;
    timeout: string;
    demoMode: string;
  };
  theme: {
    darkMode: string;
    lightMode: string;
    switchToLight: string;
    switchToDark: string;
  };
}

