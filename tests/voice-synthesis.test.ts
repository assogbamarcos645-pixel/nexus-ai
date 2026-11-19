/**
 * tests/voice-synthesis.test.ts
 *
 * Tests unitaires pour le service de synthèse vocale et d'assainissement de texte pour Voice-to-Voice.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { voiceSynthesisService } from '../src/services/voice/voiceSynthesisService.ts';

describe('NEXUS AI — Synthèse Vocale & Nettoyage Text-to-Speech (#5)', () => {
  test('Nettoie les blocs de code markdown pour une élocution fluide', () => {
    const raw = `Voici la solution :
\`\`\`typescript
const a = 1;
console.log(a);
\`\`\`
Elle est très efficace.`;

    const cleaned = voiceSynthesisService.sanitizeTextForSpeech(raw);
    assert.ok(!cleaned.includes('```'));
    assert.ok(!cleaned.includes('console.log'));
    assert.ok(cleaned.includes('[extrait de code'));
    assert.ok(cleaned.includes('Elle est très efficace'));
  });

  test('Nettoie les liens markdown, gras, italique et titres', () => {
    const raw = 'Consultez la [documentation](https://nexus.ai) pour le **Guide Pro** et *astuces* !';
    const cleaned = voiceSynthesisService.sanitizeTextForSpeech(raw);

    assert.ok(!cleaned.includes('['));
    assert.ok(!cleaned.includes(']('));
    assert.ok(!cleaned.includes('**'));
    assert.ok(!cleaned.includes('*'));
    assert.ok(cleaned.includes('Consultez la documentation pour le Guide Pro et astuces !'));
  });

  test('Gère gracieusement les textes vides ou indéfinis sans crash', () => {
    assert.strictEqual(voiceSynthesisService.sanitizeTextForSpeech(''), '');
    assert.strictEqual(voiceSynthesisService.sanitizeTextForSpeech('   '), '');
  });

  test('L’interruption stop() peut être appelée sans erreur même sans synthèse active', () => {
    assert.doesNotThrow(() => {
      voiceSynthesisService.stop();
    });
  });
});
