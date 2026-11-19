/**
 * tests/database-modeler.test.ts
 *
 * Tests unitaires pour le Studio de Modélisation BDD et le Générateur SQL / TypeScript Supabase.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePostgresSql,
  generateTypeScriptTypes,
  generateSupabaseClientSnippet,
  mapPostgresTypeToTs,
  injectSchemaIntoProject,
  DEFAULT_SAAS_SCHEMA,
  DEFAULT_ECOMMERCE_SCHEMA,
  DEFAULT_BLOG_SCHEMA,
} from '../src/services/lab/databaseModelerService.ts';
import type { LabProject } from '../src/types/lab.ts';

describe('NEXUS LAB — Studio de Modélisation de Base de Données', () => {
  describe('Mapping des types de données', () => {
    test('Mappe correctement les types relationnels vers TypeScript', () => {
      assert.strictEqual(mapPostgresTypeToTs('uuid'), 'string');
      assert.strictEqual(mapPostgresTypeToTs('text'), 'string');
      assert.strictEqual(mapPostgresTypeToTs('varchar'), 'string');
      assert.strictEqual(mapPostgresTypeToTs('integer'), 'number');
      assert.strictEqual(mapPostgresTypeToTs('numeric'), 'number');
      assert.strictEqual(mapPostgresTypeToTs('boolean'), 'boolean');
      assert.strictEqual(mapPostgresTypeToTs('timestamptz'), 'string');
      assert.ok(mapPostgresTypeToTs('jsonb').includes('unknown'));
    });
  });

  describe('Génération DDL PostgreSQL & Supabase', () => {
    test('Génère le script SQL complet avec extensions, triggers et RLS pour le SaaS', () => {
      const sql = generatePostgresSql(DEFAULT_SAAS_SCHEMA);

      // Extensions
      assert.ok(sql.includes('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'));
      assert.ok(sql.includes('CREATE EXTENSION IF NOT EXISTS "pgcrypto";'));

      // Trigger updated_at
      assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.handle_updated_at()'));

      // Tables
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."profiles"'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."organizations"'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."memberships"'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."audit_logs"'));

      // Clés étrangères & Contraintes
      assert.ok(sql.includes('REFERENCES public."organizations"("id")'));
      assert.ok(sql.includes('PRIMARY KEY'));

      // Row Level Security (RLS)
      assert.ok(sql.includes('ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;'));
      assert.ok(sql.includes('CREATE POLICY "Les utilisateurs lisent leur propre profil"'));
      assert.ok(sql.includes('USING (auth.uid() = id)'));
    });

    test('Génère les tables et contraintes pour l’E-Commerce', () => {
      const sql = generatePostgresSql(DEFAULT_ECOMMERCE_SCHEMA);
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."categories"'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."products"'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."orders"'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public."order_items"'));
      assert.ok(sql.includes('CREATE POLICY "Catalogue public en lecture seule"'));
    });
  });

  describe('Génération des types TypeScript stricts', () => {
    test('Génère les structures Database, Row, Insert, Update et helpers typés', () => {
      const ts = generateTypeScriptTypes(DEFAULT_SAAS_SCHEMA);

      assert.ok(ts.includes('export interface Database'));
      assert.ok(ts.includes('profiles: {'));
      assert.ok(ts.includes('Row: {'));
      assert.ok(ts.includes('Insert: {'));
      assert.ok(ts.includes('Update: {'));
      assert.ok(ts.includes('export type Profiles = Database[\'public\'][\'Tables\'][\'profiles\'][\'Row\'];'));
      assert.ok(ts.includes('export type NewProfiles = Database[\'public\'][\'Tables\'][\'profiles\'][\'Insert\'];'));
    });

    test('Génère le code du client Supabase prêt à l’emploi', () => {
      const client = generateSupabaseClientSnippet();
      assert.ok(client.includes("import { createClient } from '@supabase/supabase-js';"));
      assert.ok(client.includes("createClient<Database>"));
    });
  });

  describe('Injection automatique dans les fichiers du projet', () => {
    const dummyProject: LabProject = {
      id: 'proj-db-1',
      name: 'Projet Test BDD',
      description: 'Test injection',
      templateId: 'react-vite',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: [
        {
          id: 'f1',
          name: 'index.html',
          path: 'index.html',
          content: '<html></html>',
          language: 'html',
        },
      ],
    };

    test('Injecte supabase/schema.sql et src/types/database.ts sans altérer les fichiers existants', () => {
      const updated = injectSchemaIntoProject(dummyProject, DEFAULT_SAAS_SCHEMA);

      assert.strictEqual(updated.files.length, 3);
      const sqlFile = updated.files.find((f) => f.path === 'supabase/schema.sql');
      const tsFile = updated.files.find((f) => f.path === 'src/types/database.ts');

      assert.ok(sqlFile);
      assert.ok(sqlFile.content.includes('CREATE TABLE IF NOT EXISTS public."profiles"'));
      assert.strictEqual(sqlFile.language, 'plaintext');

      assert.ok(tsFile);
      assert.ok(tsFile.content.includes('export interface Database'));
      assert.strictEqual(tsFile.language, 'typescript');
    });

    test('Met à jour les fichiers existants s’ils sont déjà présents', () => {
      const projectWithFiles: LabProject = {
        ...dummyProject,
        files: [
          ...dummyProject.files,
          {
            id: 'old-sql',
            name: 'schema.sql',
            path: 'supabase/schema.sql',
            content: '-- Ancien contenu',
            language: 'plaintext',
          },
        ],
      };

      const updated = injectSchemaIntoProject(projectWithFiles, DEFAULT_BLOG_SCHEMA);
      assert.strictEqual(updated.files.length, 3); // index.html + schema.sql (mis à jour) + database.ts (créé)

      const sqlFile = updated.files.find((f) => f.path === 'supabase/schema.sql');
      assert.ok(sqlFile?.content.includes('CREATE TABLE IF NOT EXISTS public."posts"'));
      assert.ok(!sqlFile?.content.includes('-- Ancien contenu'));
    });
  });
});
