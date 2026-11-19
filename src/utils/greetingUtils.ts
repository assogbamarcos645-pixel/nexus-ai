/**
 * src/utils/greetingUtils.ts
 *
 * Générateur de messages de bienvenue et de salutations personnalisées
 * pour les utilisateurs connectés de NEXUS AI.
 * Gère les variantes :
 *  - "Bonjour 'utilisateur'" / "Bonsoir 'utilisateur'" selon l'heure
 *  - "Soyez la bienvenue 'utilisateur'"
 *  - "Bon retour 'utilisateur'"
 */

export type GreetingType = 'time-based' | 'welcome' | 'welcome-back';

export interface UserGreeting {
  type: GreetingType;
  title: string;
  message: string;
  full: string;
}

/**
 * Extrait un prénom ou nom d'affichage convivial pour l'utilisateur.
 */
export function getFriendlyUserName(fullName?: string | null, email?: string | null): string {
  if (fullName && fullName.trim()) {
    const cleaned = fullName.trim();
    // Si c'est un nom complet "Prénom Nom", on privilégie le prénom
    const parts = cleaned.split(/\s+/);
    return parts[0];
  }
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0].replace(/[._-]/g, ' ').trim();
    const firstWord = prefix.split(/\s+/)[0];
    if (firstWord) {
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
  }
  return 'Développeur';
}

/**
 * Génère une salutation personnalisée adaptée à l'heure et au contexte.
 * @param userName Nom ou prénom de l'utilisateur
 * @param preferredType Type de salutation optionnel ('time-based' | 'welcome' | 'welcome-back')
 * @param forcedHour Heure forcée pour les tests unitaires
 */
export function generateUserGreeting(
  userName: string,
  preferredType?: GreetingType,
  forcedHour?: number,
): UserGreeting {
  const currentHour = typeof forcedHour === 'number' ? forcedHour : new Date().getHours();
  const isEvening = currentHour >= 18 || currentHour < 5;
  const timeGreeting = isEvening ? 'Bonsoir' : 'Bonjour';
  const cleanName = userName?.trim() || 'Développeur';

  // Si un type précis est demandé
  if (preferredType === 'time-based') {
    return {
      type: 'time-based',
      title: `${timeGreeting} ${cleanName}`,
      message: `Ravi de vous retrouver sur votre espace NEXUS AI.`,
      full: `${timeGreeting} ${cleanName} ! Ravi de vous retrouver sur votre espace NEXUS AI.`,
    };
  }

  if (preferredType === 'welcome') {
    return {
      type: 'welcome',
      title: `Soyez la bienvenue ${cleanName}`,
      message: `Votre espace de travail est prêt pour vos nouveaux projets.`,
      full: `Soyez la bienvenue ${cleanName} ! Votre espace de travail est prêt pour vos nouveaux projets.`,
    };
  }

  if (preferredType === 'welcome-back') {
    return {
      type: 'welcome-back',
      title: `Bon retour ${cleanName}`,
      message: `Vos conversations, projets et mémoires sont synchronisés.`,
      full: `Bon retour ${cleanName} ! Vos conversations, projets et mémoires sont synchronisés.`,
    };
  }

  // Sélection intelligente par rotation temporelle pour varier l'expérience à chaque visite
  const minutes = typeof forcedHour === 'number' ? 0 : new Date().getMinutes();
  const choices: GreetingType[] = ['time-based', 'welcome', 'welcome-back'];
  const pickedType = choices[Math.floor(minutes / 20) % choices.length];

  return generateUserGreeting(cleanName, pickedType, currentHour);
}
