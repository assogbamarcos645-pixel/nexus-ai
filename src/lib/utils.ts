/**
 * src/lib/utils.ts
 *
 * Utilitaires généraux réutilisables dans toute l'application.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes Tailwind CSS sans conflits.
 * Usage : cn('px-2 py-1', condition && 'bg-red-500', 'text-sm')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Génère un identifiant unique simple (non cryptographique).
 * Remplacer par `crypto.randomUUID()` si un UUID standard est requis.
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Formate une date en heure locale française.
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Tronque un texte à la longueur spécifiée.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
