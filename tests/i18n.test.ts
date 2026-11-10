/**
 * tests/i18n.test.ts
 *
 * Tests unitaires pour le système d'internationalisation (i18n) de NEXUS AI :
 * - Catalogue des langues supportées (Français par défaut, Anglais)
 * - Parité exhaustive des clés de traduction entre 'fr' et 'en'
 * - Recherche par chemin pointé (dot notation) et gestion des fallbacks
 * - Interpolation de variables {param}
 * - Formatage régional des dates, nombres et devises (Intl)
 * - Extensibilité pour l'ajout de nouvelles langues
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from '../src/i18n/types.ts';
import { fr } from '../src/i18n/locales/fr.ts';
import { en } from '../src/i18n/locales/en.ts';

// Helper récursif pour extraire toutes les clés d'un objet en notation pointée
function getDeepKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Fonction pure de résolution de traduction (analogue à I18nContext)
function resolveTranslation(
  dict: Record<string, any>,
  fallbackDict: Record<string, any>,
  keyPath: string,
  params?: Record<string, string | number>,
): string {
  const keys = keyPath.split('.');
  let val: any = dict;
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k];
    } else {
      val = undefined;
      break;
    }
  }

  if (val === undefined || typeof val !== 'string') {
    let fallbackVal: any = fallbackDict;
    for (const k of keys) {
      if (fallbackVal && typeof fallbackVal === 'object' && k in fallbackVal) {
        fallbackVal = fallbackVal[k];
      } else {
        fallbackVal = undefined;
        break;
      }
    }
    val = fallbackVal;
  }

  if (typeof val !== 'string') {
    return keyPath;
  }

  if (params) {
    return Object.entries(params).reduce((acc, [pk, pv]) => {
      return acc.replace(new RegExp(`\\{${pk}\\}`, 'g'), String(pv));
    }, val);
  }

  return val;
}

describe('Internationalisation (i18n) — Catalogue et Configuration', () => {
  test('Le français est la langue par défaut et l’anglais est disponible', () => {
    assert.strictEqual(DEFAULT_LANGUAGE, 'fr');
    assert.strictEqual(SUPPORTED_LANGUAGES.length, 2);

    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    assert.ok(codes.includes('fr'));
    assert.ok(codes.includes('en'));

    // Vérifie que chaque option possède un libellé accessible sans se baser sur un emoji drapeau seul
    for (const lang of SUPPORTED_LANGUAGES) {
      assert.ok(lang.name.length > 0);
      assert.ok(lang.nativeName.length > 0);
      assert.ok(lang.flagSymbol.length >= 2, 'Doit comporter un code textuel lisible (ex: FR, EN)');
    }

    assert.strictEqual(LANGUAGE_STORAGE_KEY, 'nexus_language_preference_v1');
  });

  test('Parité stricte des clés entre le dictionnaire français et anglais', () => {
    const frKeys = getDeepKeys(fr);
    const enKeys = getDeepKeys(en);

    assert.ok(frKeys.length > 50, 'Le dictionnaire français doit comporter plus de 50 clés');
    assert.strictEqual(
      frKeys.length,
      enKeys.length,
      `Nombre de clés divergent : FR (${frKeys.length}) vs EN (${enKeys.length})`,
    );

    // Vérifie qu'aucune clé présente en FR ne manque en EN
    for (const key of frKeys) {
      assert.ok(enKeys.includes(key), `Clé manquante dans le dictionnaire anglais : "${key}"`);
    }

    // Vérifie qu'aucun texte n'est vide
    for (const key of enKeys) {
      const frVal = resolveTranslation(fr, fr, key);
      const enVal = resolveTranslation(en, fr, key);
      assert.ok(frVal.length > 0, `Valeur FR vide pour "${key}"`);
      assert.ok(enVal.length > 0, `Valeur EN vide pour "${key}"`);
    }
  });
});

describe('Internationalisation (i18n) — Résolution et Fallback', () => {
  test('Résout correctement les clés en français et en anglais', () => {
    const chatTitleFr = resolveTranslation(fr, fr, 'nav.chat');
    const chatTitleEn = resolveTranslation(en, fr, 'nav.chat');

    assert.strictEqual(chatTitleFr, 'NEXUS CHAT');
    assert.strictEqual(chatTitleEn, 'NEXUS CHAT');

    const newConvFr = resolveTranslation(fr, fr, 'chat.newConversation');
    const newConvEn = resolveTranslation(en, fr, 'chat.newConversation');

    assert.strictEqual(newConvFr, 'Nouvelle conversation');
    assert.strictEqual(newConvEn, 'New conversation');
  });

  test('Bascule sur le dictionnaire de secours (FR) si une clé est absente d’une langue', () => {
    const incompleteEn = { common: { save: 'Save' } };
    const resolvedFallback = resolveTranslation(incompleteEn, fr, 'common.cancel');

    assert.strictEqual(resolvedFallback, 'Annuler');
  });

  test('Renvoie le chemin de clé brut si la clé est totalement introuvable', () => {
    const missing = resolveTranslation(en, fr, 'unknown.non.existent.path');
    assert.strictEqual(missing, 'unknown.non.existent.path');
  });

  test('Gère l’interpolation dynamique de paramètres {variable}', () => {
    const dictWithVar = {
      greeting: 'Bonjour {name}, bienvenue sur {app} !',
    };

    const interpolated = resolveTranslation(dictWithVar, fr, 'greeting', {
      name: 'Marcos',
      app: 'NEXUS AI',
    });

    assert.strictEqual(interpolated, 'Bonjour Marcos, bienvenue sur NEXUS AI !');
  });
});

describe('Internationalisation (i18n) — Formatage Régional (Intl)', () => {
  test('Formatage des nombres selon la locale', () => {
    const value = 1234567.89;

    const frFormatted = new Intl.NumberFormat('fr-FR').format(value);
    const enFormatted = new Intl.NumberFormat('en-US').format(value);

    // En français, l'espace insécable sépare les milliers et la virgule les décimales
    assert.ok(frFormatted.includes(',') || frFormatted.includes(' '));
    // En anglais, la virgule sépare les milliers et le point les décimales
    assert.ok(enFormatted.includes('.') && enFormatted.includes(','));
    assert.strictEqual(enFormatted, '1,234,567.89');
  });

  test('Formatage des devises sans altérer la devise de référence (USD $)', () => {
    const cost = 0.0452;

    const frCurrency = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);

    const enCurrency = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(cost);

    assert.ok(frCurrency.includes('$') || frCurrency.includes('USD'));
    assert.ok(enCurrency.includes('$'));
  });

  test('Formatage des dates selon la locale', () => {
    const date = new Date('2026-10-16T14:30:00Z');

    const frDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
    const enDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);

    assert.ok(frDate.length > 5);
    assert.ok(enDate.length > 5);
    assert.notStrictEqual(frDate, enDate);
  });
});

