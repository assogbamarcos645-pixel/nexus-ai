import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes conditionally and without conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
