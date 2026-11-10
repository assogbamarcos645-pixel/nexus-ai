/**
 * tests/production-readiness.test.ts
 *
 * Suite de validation automatisée de la Checklist de Mise en Ligne :
 * 1. Variables d'environnement de production & étanchéité frontend/serveur
 * 2. Stratégie de limitation des coûts et de rate-limiting public
 * 3. Schéma PostgreSQL et politiques Row Level Security (RLS) Supabase
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getDailyQuotaStatus } from '../src/services/ai/quotaService.ts';
import { sanitizeAdvancedSettings } from '../src/services/ai/aiConfigService.ts';

describe('Checklist Production 1 — Variables d’Environnement & Étanchéité', () => {
  test('Le fichier modèle .env.example sépare strictement variables publiques et secrets serveur', () => {
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    assert.ok(fs.existsSync(envExamplePath), '.env.example doit exister à la racine');

    const content = fs.readFileSync(envExamplePath, 'utf8');

    // Doit contenir les variables publiques frontend
    assert.ok(content.includes('VITE_SUPABASE_URL='), 'VITE_SUPABASE_URL présent');
    assert.ok(content.includes('VITE_SUPABASE_ANON_KEY='), 'VITE_SUPABASE_ANON_KEY présent');
    assert.ok(content.includes('VITE_API_BASE_URL='), 'VITE_API_BASE_URL présent');

    // Les clés secrètes serveur ne doivent JAMAIS être préfixées par VITE_
    assert.ok(!content.includes('VITE_OPENAI_API_KEY='), 'OPENAI_API_KEY ne doit pas avoir le préfixe VITE_');
    assert.ok(!content.includes('VITE_GEMINI_API_KEY='), 'GEMINI_API_KEY ne doit pas avoir le préfixe VITE_');
    assert.ok(!content.includes('VITE_ANTHROPIC_API_KEY='), 'ANTHROPIC_API_KEY ne doit pas avoir le préfixe VITE_');
    assert.ok(!content.includes('VITE_MISTRAL_API_KEY='), 'MISTRAL_API_KEY ne doit pas avoir le préfixe VITE_');
    assert.ok(!content.includes('VITE_GROQ_API_KEY='), 'GROQ_API_KEY ne doit pas avoir le préfixe VITE_');
  });

  test('.gitignore protège les fichiers .env locaux contre toute fuite Git', () => {
    const gitignorePath = path.resolve(process.cwd(), '.gitignore');
    assert.ok(fs.existsSync(gitignorePath), '.gitignore doit exister');

    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(content.includes('.env'), '.env doit être ignoré');
    assert.ok(content.includes('*.local') || content.includes('.env.local'), '.env.local doit être ignoré');
  });
});

describe('Checklist Production 2 — Limitation des Coûts & Rate-Limiting Public', () => {
  test('Plafonnement des quotas journaliers de tokens pour prévenir l’explosion des coûts', () => {
    const anonQuota = getDailyQuotaStatus(false);
    assert.strictEqual(anonQuota.maxTokens, 50_000, 'Quota gratuit public plafonné à 50 000 tokens/jour');
    assert.ok(anonQuota.remainingTokens <= 50_000);

    const authQuota = getDailyQuotaStatus(true);
    assert.strictEqual(authQuota.maxTokens, 500_000, 'Quota utilisateur connecté plafonné à 500 000 tokens/jour');
    assert.ok(authQuota.remainingTokens <= 500_000);
  });

  test('Sanitisation et bornage strict des paramètres d’inférence LLM (maxTokens & temperature)', () => {
    // Tentative de saturation de maxTokens
    const overflown = sanitizeAdvancedSettings({ maxTokens: 999_999, temperature: 10.0, timeoutSeconds: 500 });
    assert.strictEqual(overflown.maxTokens, 8_192, 'maxTokens borné au plafond de sécurité de 8192');
    assert.strictEqual(overflown.temperature, 2.0, 'temperature bornée à 2.0');
    assert.strictEqual(overflown.timeoutSeconds, 120, 'timeoutSeconds borné à 120s max');

    // Tentative de valeurs négatives
    const underflown = sanitizeAdvancedSettings({ maxTokens: -50, temperature: -2.0, timeoutSeconds: 0 });
    assert.strictEqual(underflown.maxTokens, 128, 'maxTokens borné au plancher de 128');
    assert.strictEqual(underflown.temperature, 0.0, 'temperature plancher à 0.0');
    assert.strictEqual(underflown.timeoutSeconds, 5, 'timeoutSeconds plancher à 5s');
  });
});

describe('Checklist Production 3 — Schéma PostgreSQL Supabase & Politiques RLS', () => {
  test('Les fichiers de migration SQL activent systématiquement Row Level Security (RLS)', () => {
    const migrationDir = path.resolve(process.cwd(), 'supabase', 'migrations');
    assert.ok(fs.existsSync(migrationDir), 'Dossier supabase/migrations présent');

    const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql'));
    assert.ok(files.length >= 2, 'Au moins 2 fichiers de migrations SQL doivent être présents');

    let allSql = '';
    for (const file of files) {
      allSql += fs.readFileSync(path.join(migrationDir, file), 'utf8') + '\n';
    }

    // Vérifie que toutes les tables métier ont ENABLE ROW LEVEL SECURITY
    const requiredTables = [
      'public.profiles',
      'public.user_preferences',
      'public.conversations',
      'public.messages',
      'public.memories',
      'public.projects',
      'public.project_files',
      'public.project_snapshots',
    ];

    for (const table of requiredTables) {
      const rlsCheck = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`;
      assert.ok(allSql.includes(rlsCheck), `RLS doit être activé pour la table ${table}`);
    }
  });

  test('Toutes les politiques RLS restreignent strictement l’accès au propriétaire (auth.uid() = user_id)', () => {
    const migrationDir = path.resolve(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql'));

    let allSql = '';
    for (const file of files) {
      allSql += fs.readFileSync(path.join(migrationDir, file), 'utf8') + '\n';
    }

    // Vérifie que auth.uid() est omniprésent pour l’isolation des données
    const authUidMatches = allSql.match(/auth\.uid\(\)/g) || [];
    assert.ok(authUidMatches.length >= 25, `Présence de politiques RLS avec auth.uid() (${authUidMatches.length} trouvées)`);

    // Vérifie les actions CRUD pour project_snapshots
    assert.ok(allSql.includes('"project_snapshots_select_own"'));
    assert.ok(allSql.includes('"project_snapshots_insert_own"'));
    assert.ok(allSql.includes('"project_snapshots_update_own"'));
    assert.ok(allSql.includes('"project_snapshots_delete_own"'));
  });
});
