import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateUserGreeting,
  getFriendlyUserName,
} from '../src/utils/greetingUtils.ts';

describe('Système de salutations personnalisées (greetingUtils)', () => {
  test('Extrait un prénom convivial depuis le nom complet ou l’adresse e-mail', () => {
    assert.equal(getFriendlyUserName('Marcos Assogba', 'marcos@test.com'), 'Marcos');
    assert.equal(getFriendlyUserName('Sophie Martin', 'sophie@test.com'), 'Sophie');
    assert.equal(getFriendlyUserName('', 'alex.dupont@test.com'), 'Alex');
    assert.equal(getFriendlyUserName(null, 'claire_dev@test.com'), 'Claire');
    assert.equal(getFriendlyUserName(null, null), 'Développeur');
  });

  test('Génère "Bonjour" en journée (matin et après-midi)', () => {
    // 10h du matin
    const morningGreeting = generateUserGreeting('Marcos', 'time-based', 10);
    assert.equal(morningGreeting.title, 'Bonjour Marcos');
    assert.ok(morningGreeting.message.includes('NEXUS AI'));

    // 14h de l'après-midi
    const afternoonGreeting = generateUserGreeting('Marcos', 'time-based', 14);
    assert.equal(afternoonGreeting.title, 'Bonjour Marcos');
  });

  test('Génère "Bonsoir" en soirée et nuit', () => {
    // 19h le soir
    const eveningGreeting = generateUserGreeting('Marcos', 'time-based', 19);
    assert.equal(eveningGreeting.title, 'Bonsoir Marcos');

    // 23h la nuit
    const nightGreeting = generateUserGreeting('Marcos', 'time-based', 23);
    assert.equal(nightGreeting.title, 'Bonsoir Marcos');
  });

  test('Génère "Soyez la bienvenue" pour la bienvenue', () => {
    const welcomeGreeting = generateUserGreeting('Marcos', 'welcome', 12);
    assert.equal(welcomeGreeting.title, 'Soyez la bienvenue Marcos');
    assert.ok(welcomeGreeting.message.includes('Votre espace de travail est prêt'));
  });

  test('Génère "Bon retour" lors de la reconnexion', () => {
    const welcomeBack = generateUserGreeting('Marcos', 'welcome-back', 15);
    assert.equal(welcomeBack.title, 'Bon retour Marcos');
    assert.ok(welcomeBack.message.includes('synchronisés'));
  });
});
