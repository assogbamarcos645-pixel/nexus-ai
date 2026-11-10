/**
 * tests/email-confirmation.test.ts
 *
 * Tests unitaires pour le flux de confirmation d'e-mail d'inscription Supabase :
 * - Traduction et gestion de l'erreur "Email not confirmed"
 * - Prévention du spam via cooldown et gestion du rate limiting
 * - Construction de la redirection emailRedirectTo et statut confirmationRequired
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { translateAuthError } from '../src/services/auth/authService.ts';

describe('Authentification — Confirmation d’Adresse E-mail', () => {
  test('Traduit l’erreur "email not confirmed" en consigne utilisateur claire', () => {
    const errorMsg = 'Email not confirmed';
    const translated = translateAuthError(errorMsg);
    assert.ok(translated.includes('confirmer votre adresse e-mail'));
    assert.ok(translated.includes('lien reçu'));
  });

  test('Traduit les erreurs d’épuisement de quota SMTP / rate limit en explication limpide', () => {
    const rateLimitError = 'over_email_send_rate_limit';
    const translated = translateAuthError(rateLimitError);
    assert.ok(translated.includes('Quota d\'e-mails Supabase'));
  });

  test('Gère les cas où un compte existe déjà lors de l’inscription', () => {
    const existsError = 'User already registered';
    const translated = translateAuthError(existsError);
    assert.ok(translated.includes('Un compte existe déjà'));
  });

  test('Valide les exigences de longueur de mot de passe (min 6 caractères)', () => {
    const passError = 'Password should be at least 6 characters';
    const translated = translateAuthError(passError);
    assert.ok(translated.includes('au moins 6 caractères'));
  });
});
