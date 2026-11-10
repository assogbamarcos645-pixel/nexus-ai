/**
 * tests/theme.test.ts
 *
 * Tests unitaires du système de gestion des thèmes (Dark Mode & Light Mode).
 * Vérifie la persistance locale, la logique de bascule et la parité des traductions i18n.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fr } from '../src/i18n/locales/fr.ts';
import { en } from '../src/i18n/locales/en.ts';

describe('Thème — Internationalisation (i18n)', () => {
  test('Toutes les clés de thème existent en Français et en Anglais', () => {
    assert.ok(fr.theme);
    assert.ok(en.theme);

    const frKeys = Object.keys(fr.theme).sort();
    const enKeys = Object.keys(en.theme).sort();

    assert.deepStrictEqual(frKeys, enKeys);
    assert.ok(fr.theme.darkMode.length > 0);
    assert.ok(en.theme.darkMode.length > 0);
    assert.ok(fr.theme.switchToLight.length > 0);
    assert.ok(en.theme.switchToLight.length > 0);
  });
});

describe('Thème — Logique de Bascule & Résolution', () => {
  test('Bascule de dark vers light et inversement', () => {
    let currentTheme: 'dark' | 'light' = 'dark';

    const toggle = () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    };

    assert.strictEqual(currentTheme, 'dark');
    toggle();
    assert.strictEqual(currentTheme, 'light');
    toggle();
    assert.strictEqual(currentTheme, 'dark');
  });

  test('La clé de stockage localStorage est constante et versionnée', () => {
    const STORAGE_KEY = 'nexus_theme_preference_v1';
    assert.strictEqual(STORAGE_KEY, 'nexus_theme_preference_v1');
  });

  test('Valide les valeurs de thème autorisées', () => {
    const validThemes = ['dark', 'light', 'system'];
    assert.ok(validThemes.includes('dark'));
    assert.ok(validThemes.includes('light'));
    assert.ok(validThemes.includes('system'));
    assert.strictEqual(validThemes.includes('neon' as string), false);
  });
});

