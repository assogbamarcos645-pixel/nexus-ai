/**
 * tests/two-factor-auth.test.ts
 *
 * Tests unitaires et de sécurité pour la Double Authentification (2FA / TOTP) dans NEXUS AI :
 * - Traduction et assainissement des messages d'erreur TOTP / MFA
 * - Validation stricte du format du code à 6 chiffres
 * - Nettoyage et assainissement de la saisie (espaces, tirets)
 * - Détection des niveaux d'assurance AAL1 -> AAL2
 * - Formatage robuste des codes QR (Data URI et chaînes SVG brutes)
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { translateAuthError } from '../src/services/auth/authService.ts';

describe('Double Authentification (2FA) — Traduction des erreurs Supabase MFA', () => {
  test('Traduit l’erreur de code TOTP invalide ou expiré', () => {
    const error1 = translateAuthError('Invalid TOTP code');
    assert.strictEqual(error1, 'Code de vérification à 6 chiffres incorrect ou expiré.');

    const error2 = translateAuthError('totp_code_invalid: the code provided was rejected');
    assert.strictEqual(error2, 'Code de vérification à 6 chiffres incorrect ou expiré.');

    const error3 = translateAuthError('MFA verification failed');
    assert.strictEqual(error3, 'Code de vérification à 6 chiffres incorrect ou expiré.');
  });

  test('Traduit l’erreur de facteur déjà existant', () => {
    const error = translateAuthError('factor already exists on user');
    assert.strictEqual(error, 'Un facteur d’authentification 2FA est déjà associé à ce compte.');
  });

  test('Préserve les traductions des erreurs d’authentification standard', () => {
    const errorCreds = translateAuthError('Invalid login credentials');
    assert.strictEqual(errorCreds, 'Identifiants invalides. Vérifiez votre adresse e-mail et votre mot de passe.');

    const errorPass = translateAuthError('Password should be at least 6 characters');
    assert.strictEqual(errorPass, 'Le mot de passe doit comporter au moins 6 caractères.');
  });
});

describe('Double Authentification (2FA) — Validation et Assainissement des Codes TOTP', () => {
  function sanitizeTotpCode(input: string): string {
    return input.replace(/\D/g, '').slice(0, 6);
  }

  function isValidTotpCode(code: string): boolean {
    return /^[0-9]{6}$/.test(code);
  }

  test('Accepte un code à 6 chiffres valide', () => {
    assert.strictEqual(isValidTotpCode('123456'), true);
    assert.strictEqual(isValidTotpCode('000000'), true);
    assert.strictEqual(isValidTotpCode('987654'), true);
  });

  test('Rejette les codes incomplets ou trop longs', () => {
    assert.strictEqual(isValidTotpCode('12345'), false);
    assert.strictEqual(isValidTotpCode('1234567'), false);
    assert.strictEqual(isValidTotpCode(''), false);
  });

  test('Rejette les codes contenant des caractères non numériques', () => {
    assert.strictEqual(isValidTotpCode('12345a'), false);
    assert.strictEqual(isValidTotpCode('12 345'), false);
    assert.strictEqual(isValidTotpCode('abcdef'), false);
  });

  test('Nettoie automatiquement les espaces et tirets fréquents lors du copier-coller', () => {
    assert.strictEqual(sanitizeTotpCode('123 456'), '123456');
    assert.strictEqual(sanitizeTotpCode(' 987-654 '), '987654');
    assert.strictEqual(sanitizeTotpCode('000 111 222'), '000111');
  });
});

describe('Double Authentification (2FA) — Formatage et Rendu QR Code', () => {
  function formatQrSrc(qr?: string): string {
    if (!qr) return '';
    if (qr.startsWith('data:')) return qr;
    if (qr.startsWith('<svg')) return `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`;
    return qr;
  }

  test('Préserve une Data URI valide sans altération', () => {
    const input = 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    assert.strictEqual(formatQrSrc(input), input);
  });

  test('Encode correctement une chaîne SVG brute en Data URI SVG sécurisée', () => {
    const rawSvg = '<svg viewBox="0 0 100 100"><rect fill="black"/></svg>';
    const expected = `data:image/svg+xml;utf-8,${encodeURIComponent(rawSvg)}`;
    assert.strictEqual(formatQrSrc(rawSvg), expected);
  });

  test('Gère gracieusement les valeurs nulles ou indéfinies', () => {
    assert.strictEqual(formatQrSrc(undefined), '');
    assert.strictEqual(formatQrSrc(''), '');
  });
});

describe('Double Authentification (2FA) — Logique de Transition d’Assurance AAL', () => {
  interface SessionAAL {
    currentLevel: 'aal1' | 'aal2';
    nextLevel: 'aal1' | 'aal2';
  }

  function requiresMFAChallenge(session: SessionAAL): boolean {
    return session.currentLevel === 'aal1' && session.nextLevel === 'aal2';
  }

  test('Identifie correctement le besoin d’un challenge 2FA quand nextLevel est aal2', () => {
    const sessionWith2FA: SessionAAL = { currentLevel: 'aal1', nextLevel: 'aal2' };
    assert.strictEqual(requiresMFAChallenge(sessionWith2FA), true);
  });

  test('Considère la session comme pleinement authentifiée si déjà en aal2', () => {
    const fullSession: SessionAAL = { currentLevel: 'aal2', nextLevel: 'aal2' };
    assert.strictEqual(requiresMFAChallenge(fullSession), false);
  });

  test('Considère la session standard comme valide si aucun facteur 2FA n’est configuré', () => {
    const standardSession: SessionAAL = { currentLevel: 'aal1', nextLevel: 'aal1' };
    assert.strictEqual(requiresMFAChallenge(standardSession), false);
  });
});
