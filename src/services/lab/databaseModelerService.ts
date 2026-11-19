/**
 * src/services/lab/databaseModelerService.ts
 *
 * Moteur de modélisation de bases de données relationnelles pour NEXUS LAB.
 * Génère automatiquement :
 *  1. Les scripts DDL SQL complets optimisés pour PostgreSQL & Supabase (RLS, Triggers, UUID, FK).
 *  2. Les définitions d'interfaces et types TypeScript stricts (Row, Insert, Update, Database).
 *  3. L'injection directe dans les fichiers du projet en 1 clic.
 */

import type {
  DbSchema,
  DbColumnType,
} from '../../types/databaseModeler.ts';
import type { LabProject } from '../../types/lab.ts';

/**
 * Traduit un type de colonne PostgreSQL vers un type TypeScript strict.
 */
export function mapPostgresTypeToTs(type: DbColumnType): string {
  switch (type) {
    case 'uuid':
    case 'text':
    case 'varchar':
    case 'date':
    case 'timestamp':
    case 'timestamptz':
      return 'string';
    case 'integer':
    case 'bigint':
    case 'numeric':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'jsonb':
      return 'Record<string, unknown> | unknown[]';
    case 'bytea':
      return 'string';
    default:
      return 'unknown';
  }
}

/**
 * Génère le script SQL PostgreSQL / Supabase complet avec clés primaires,
 * contraintes d'intégrité, relations, triggers d'horodatage et politiques RLS.
 */
export function generatePostgresSql(schema: DbSchema): string {
  const lines: string[] = [];

  lines.push(`-- =========================================================`);
  lines.push(`-- Schéma généré par NEXUS AI — Studio de Modélisation BDD`);
  lines.push(`-- Projet : ${schema.name || 'Application NEXUS'}`);
  lines.push(`-- Compatible : PostgreSQL 14+, Supabase, Neon & AWS RDS`);
  lines.push(`-- Date : ${new Date().toISOString()}`);
  lines.push(`-- =========================================================\n`);

  lines.push(`-- 1. Activation des extensions requises`);
  lines.push(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  lines.push(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n`);

  lines.push(`-- 2. Fonction utilitaire pour mise à jour automatique de updated_at`);
  lines.push(`CREATE OR REPLACE FUNCTION public.handle_updated_at()`);
  lines.push(`RETURNS TRIGGER AS $$`);
  lines.push(`BEGIN`);
  lines.push(`  NEW.updated_at = NOW();`);
  lines.push(`  RETURN NEW;`);
  lines.push(`END;`);
  lines.push(`$$ LANGUAGE plpgsql;\n`);

  // Création des tables
  for (const table of schema.tables) {
    const tableName = table.name.trim().toLowerCase();
    lines.push(`-- ---------------------------------------------------------`);
    lines.push(`-- Table : ${tableName}`);
    if (table.comment) {
      lines.push(`-- Description : ${table.comment}`);
    }
    lines.push(`-- ---------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS public."${tableName}" (`);

    const colDefs: string[] = [];
    const tableConstraints: string[] = [];

    for (const col of table.columns) {
      let def = `  "${col.name}" ${col.type.toUpperCase()}`;

      if (col.isPrimaryKey) {
        def += ' PRIMARY KEY';
        if (col.type === 'uuid' && !col.defaultValue) {
          def += ' DEFAULT gen_random_uuid()';
        }
      }

      if (!col.isNullable && !col.isPrimaryKey) {
        def += ' NOT NULL';
      }

      if (col.isUnique && !col.isPrimaryKey) {
        def += ' UNIQUE';
      }

      if (col.defaultValue && !col.isPrimaryKey) {
        def += ` DEFAULT ${col.defaultValue}`;
      }

      if (col.isForeignKey && col.referencesTable && col.referencesColumn) {
        const onDelete = col.onDelete || 'CASCADE';
        def += ` REFERENCES public."${col.referencesTable.toLowerCase()}"("${col.referencesColumn}") ON DELETE ${onDelete}`;
      }

      colDefs.push(def);
    }

    lines.push(colDefs.concat(tableConstraints).join(',\n'));
    lines.push(`);\n`);

    // Trigger de mise à jour updated_at si la colonne existe
    const hasUpdatedAt = table.columns.some((c) => c.name === 'updated_at');
    if (hasUpdatedAt) {
      lines.push(`DROP TRIGGER IF EXISTS set_${tableName}_updated_at ON public."${tableName}";`);
      lines.push(`CREATE TRIGGER set_${tableName}_updated_at`);
      lines.push(`  BEFORE UPDATE ON public."${tableName}"`);
      lines.push(`  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();\n`);
    }

    // Sécurité RLS (Row Level Security)
    if (table.enableRls) {
      lines.push(`-- Activation de la sécurité RLS pour la table ${tableName}`);
      lines.push(`ALTER TABLE public."${tableName}" ENABLE ROW LEVEL SECURITY;\n`);
    }
  }

  // Politiques RLS
  if (schema.policies && schema.policies.length > 0) {
    lines.push(`-- =========================================================`);
    lines.push(`-- 3. Politiques de Sécurité Row Level Security (RLS)`);
    lines.push(`-- =========================================================\n`);

    for (const pol of schema.policies) {
      const targetTable = schema.tables.find((t) => t.id === pol.tableId);
      if (!targetTable) continue;
      const tableName = targetTable.name.trim().toLowerCase();

      lines.push(`-- RLS : ${pol.name} sur ${tableName}`);
      lines.push(`DROP POLICY IF EXISTS "${pol.name}" ON public."${tableName}";`);
      let policySql = `CREATE POLICY "${pol.name}" ON public."${tableName}"\n  FOR ${pol.action}\n  TO ${pol.role}`;

      if (pol.usingExpression) {
        policySql += `\n  USING (${pol.usingExpression})`;
      }
      if (pol.checkExpression && (pol.action === 'INSERT' || pol.action === 'UPDATE' || pol.action === 'ALL')) {
        policySql += `\n  WITH CHECK (${pol.checkExpression})`;
      }
      policySql += `;\n`;
      lines.push(policySql);
    }
  }

  return lines.join('\n');
}

/**
 * Génère le fichier d'interfaces TypeScript typé pour Supabase Client ou ORM.
 */
export function generateTypeScriptTypes(schema: DbSchema): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * Types TypeScript générés automatiquement par NEXUS AI.`);
  lines.push(` * Schéma : ${schema.name || 'Application'}`);
  lines.push(` * Date : ${new Date().toISOString()}`);
  lines.push(` */\n`);

  lines.push(`export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n`);

  lines.push(`export interface Database {`);
  lines.push(`  public: {`);
  lines.push(`    Tables: {`);

  for (const table of schema.tables) {
    const tableName = table.name.trim().toLowerCase();
    lines.push(`      ${tableName}: {`);

    // Row (Lecture)
    lines.push(`        Row: {`);
    for (const col of table.columns) {
      const tsType = mapPostgresTypeToTs(col.type);
      const isNull = col.isNullable ? ' | null' : '';
      lines.push(`          ${col.name}: ${tsType}${isNull};`);
    }
    lines.push(`        };`);

    // Insert (Création)
    lines.push(`        Insert: {`);
    for (const col of table.columns) {
      const tsType = mapPostgresTypeToTs(col.type);
      const isOptional = col.isPrimaryKey || col.isNullable || col.defaultValue ? '?' : '';
      const isNull = col.isNullable ? ' | null' : '';
      lines.push(`          ${col.name}${isOptional}: ${tsType}${isNull};`);
    }
    lines.push(`        };`);

    // Update (Modification)
    lines.push(`        Update: {`);
    for (const col of table.columns) {
      const tsType = mapPostgresTypeToTs(col.type);
      const isNull = col.isNullable ? ' | null' : '';
      lines.push(`          ${col.name}?: ${tsType}${isNull};`);
    }
    lines.push(`        };`);

    lines.push(`      };`);
  }

  lines.push(`    };`);
  lines.push(`    Views: Record<string, never>;`);
  lines.push(`    Functions: Record<string, never>;`);
  lines.push(`  };`);
  lines.push(`}\n`);

  // Types helper raccourcis
  for (const table of schema.tables) {
    const tableName = table.name.trim().toLowerCase();
    const pascalName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
    lines.push(`export type ${pascalName} = Database['public']['Tables']['${tableName}']['Row'];`);
    lines.push(`export type New${pascalName} = Database['public']['Tables']['${tableName}']['Insert'];`);
    lines.push(`export type Update${pascalName} = Database['public']['Tables']['${tableName}']['Update'];`);
  }

  return lines.join('\n');
}

/**
 * Génère le code d'initialisation de client Supabase typé.
 */
export function generateSupabaseClientSnippet(): string {
  return `import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
`;
}

/**
 * Modèle prêt à l'emploi : SaaS B2B Multi-Tenant avec abonnements et audit.
 */
export const DEFAULT_SAAS_SCHEMA: DbSchema = {
  id: 'schema-saas',
  name: 'SaaS Multi-Tenant Pro',
  description: 'Architecture avec organisations, membres, abonnements Stripe et traçabilité des logs.',
  tables: [
    {
      id: 'tbl-users',
      name: 'profiles',
      comment: 'Profils utilisateurs liés à Supabase Auth',
      enableRls: true,
      columns: [
        { id: 'c1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'auth.uid()' },
        { id: 'c2', name: 'email', type: 'text', isUnique: true, isNullable: false },
        { id: 'c3', name: 'full_name', type: 'text', isNullable: true },
        { id: 'c4', name: 'avatar_url', type: 'text', isNullable: true },
        { id: 'c5', name: 'role', type: 'varchar', defaultValue: "'member'", isNullable: false },
        { id: 'c6', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
        { id: 'c7', name: 'updated_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
    {
      id: 'tbl-orgs',
      name: 'organizations',
      comment: 'Espaces de travail et entreprises',
      enableRls: true,
      columns: [
        { id: 'o1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'o2', name: 'name', type: 'text', isNullable: false },
        { id: 'o3', name: 'slug', type: 'varchar', isUnique: true, isNullable: false },
        { id: 'o4', name: 'plan', type: 'varchar', defaultValue: "'starter'", isNullable: false },
        { id: 'o5', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
        { id: 'o6', name: 'updated_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
    {
      id: 'tbl-memberships',
      name: 'memberships',
      comment: 'Association membres / organisations avec droits',
      enableRls: true,
      columns: [
        { id: 'm1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'm2', name: 'org_id', type: 'uuid', isForeignKey: true, referencesTable: 'organizations', referencesColumn: 'id', isNullable: false },
        { id: 'm3', name: 'user_id', type: 'uuid', isForeignKey: true, referencesTable: 'profiles', referencesColumn: 'id', isNullable: false },
        { id: 'm4', name: 'role', type: 'varchar', defaultValue: "'member'", isNullable: false },
        { id: 'm5', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
    {
      id: 'tbl-audit',
      name: 'audit_logs',
      comment: 'Journal des événements et actions sensibles',
      enableRls: true,
      columns: [
        { id: 'a1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'a2', name: 'org_id', type: 'uuid', isForeignKey: true, referencesTable: 'organizations', referencesColumn: 'id', isNullable: false },
        { id: 'a3', name: 'user_id', type: 'uuid', isForeignKey: true, referencesTable: 'profiles', referencesColumn: 'id', isNullable: true },
        { id: 'a4', name: 'action', type: 'varchar', isNullable: false },
        { id: 'a5', name: 'metadata', type: 'jsonb', defaultValue: "'{}'::jsonb", isNullable: false },
        { id: 'a6', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
  ],
  policies: [
    {
      id: 'pol-profiles-read',
      tableId: 'tbl-users',
      name: 'Les utilisateurs lisent leur propre profil',
      action: 'SELECT',
      role: 'authenticated',
      usingExpression: 'auth.uid() = id',
    },
    {
      id: 'pol-profiles-update',
      tableId: 'tbl-users',
      name: 'Les utilisateurs modifient leur propre profil',
      action: 'UPDATE',
      role: 'authenticated',
      usingExpression: 'auth.uid() = id',
      checkExpression: 'auth.uid() = id',
    },
    {
      id: 'pol-audit-read',
      tableId: 'tbl-audit',
      name: 'Les membres authentifiés lisent les logs de leur organisation',
      action: 'SELECT',
      role: 'authenticated',
      usingExpression: 'EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = audit_logs.org_id AND memberships.user_id = auth.uid())',
    },
  ],
};

/**
 * Modèle prêt à l'emploi : E-Commerce & Catalogue de Produits.
 */
export const DEFAULT_ECOMMERCE_SCHEMA: DbSchema = {
  id: 'schema-ecommerce',
  name: 'Boutique E-Commerce & Commandes',
  description: 'Catalogue produits, gestion des catégories, commandes clients et lignes de panier.',
  tables: [
    {
      id: 'tbl-categories',
      name: 'categories',
      comment: 'Catégories de produits du catalogue',
      enableRls: true,
      columns: [
        { id: 'cat1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'cat2', name: 'name', type: 'text', isNullable: false },
        { id: 'cat3', name: 'slug', type: 'varchar', isUnique: true, isNullable: false },
        { id: 'cat4', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
    {
      id: 'tbl-products',
      name: 'products',
      comment: 'Articles du catalogue',
      enableRls: true,
      columns: [
        { id: 'p1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'p2', name: 'category_id', type: 'uuid', isForeignKey: true, referencesTable: 'categories', referencesColumn: 'id', isNullable: true },
        { id: 'p3', name: 'title', type: 'text', isNullable: false },
        { id: 'p4', name: 'description', type: 'text', isNullable: true },
        { id: 'p5', name: 'price', type: 'numeric', isNullable: false },
        { id: 'p6', name: 'stock_quantity', type: 'integer', defaultValue: '0', isNullable: false },
        { id: 'p7', name: 'image_url', type: 'text', isNullable: true },
        { id: 'p8', name: 'is_active', type: 'boolean', defaultValue: 'true', isNullable: false },
        { id: 'p9', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
        { id: 'p10', name: 'updated_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
    {
      id: 'tbl-orders',
      name: 'orders',
      comment: 'Commandes passées par les clients',
      enableRls: true,
      columns: [
        { id: 'ord1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'ord2', name: 'customer_email', type: 'text', isNullable: false },
        { id: 'ord3', name: 'total_amount', type: 'numeric', isNullable: false },
        { id: 'ord4', name: 'status', type: 'varchar', defaultValue: "'pending'", isNullable: false },
        { id: 'ord5', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
        { id: 'ord6', name: 'updated_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
    {
      id: 'tbl-order-items',
      name: 'order_items',
      comment: 'Détail des articles commandés',
      enableRls: true,
      columns: [
        { id: 'oi1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'oi2', name: 'order_id', type: 'uuid', isForeignKey: true, referencesTable: 'orders', referencesColumn: 'id', isNullable: false },
        { id: 'oi3', name: 'product_id', type: 'uuid', isForeignKey: true, referencesTable: 'products', referencesColumn: 'id', isNullable: false },
        { id: 'oi4', name: 'quantity', type: 'integer', defaultValue: '1', isNullable: false },
        { id: 'oi5', name: 'unit_price', type: 'numeric', isNullable: false },
      ],
    },
  ],
  policies: [
    {
      id: 'pol-products-public',
      tableId: 'tbl-products',
      name: 'Catalogue public en lecture seule',
      action: 'SELECT',
      role: 'public',
      usingExpression: 'is_active = true',
    },
  ],
};

/**
 * Modèle prêt à l'emploi : Blog, Documentation & Commentaires.
 */
export const DEFAULT_BLOG_SCHEMA: DbSchema = {
  id: 'schema-blog',
  name: 'Blog & Articles avec Commentaires',
  description: 'Articles, statut de publication, tags et commentaires modérés.',
  tables: [
    {
      id: 'tbl-posts',
      name: 'posts',
      comment: 'Articles du blog',
      enableRls: true,
      columns: [
        { id: 'post1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'post2', name: 'title', type: 'text', isNullable: false },
        { id: 'post3', name: 'slug', type: 'varchar', isUnique: true, isNullable: false },
        { id: 'post4', name: 'content', type: 'text', isNullable: false },
        { id: 'post5', name: 'published', type: 'boolean', defaultValue: 'false', isNullable: false },
        { id: 'post6', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
        { id: 'post7', name: 'updated_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
    {
      id: 'tbl-comments',
      name: 'comments',
      comment: 'Commentaires des lecteurs',
      enableRls: true,
      columns: [
        { id: 'com1', name: 'id', type: 'uuid', isPrimaryKey: true, defaultValue: 'gen_random_uuid()' },
        { id: 'com2', name: 'post_id', type: 'uuid', isForeignKey: true, referencesTable: 'posts', referencesColumn: 'id', isNullable: false },
        { id: 'com3', name: 'author_name', type: 'text', isNullable: false },
        { id: 'com4', name: 'content', type: 'text', isNullable: false },
        { id: 'com5', name: 'created_at', type: 'timestamptz', defaultValue: 'now()', isNullable: false },
      ],
    },
  ],
  policies: [
    {
      id: 'pol-posts-public',
      tableId: 'tbl-posts',
      name: 'Articles publiés visibles par tous',
      action: 'SELECT',
      role: 'public',
      usingExpression: 'published = true',
    },
  ],
};

/**
 * Injecte le schéma généré (SQL DDL et interfaces TypeScript) directement dans les fichiers du projet.
 */
export function injectSchemaIntoProject(project: LabProject, schema: DbSchema): LabProject {
  const sqlContent = generatePostgresSql(schema);
  const tsContent = generateTypeScriptTypes(schema);

  const updatedFiles = [...project.files];

  // 1. Fichier SQL DDL : supabase/schema.sql
  const existingSqlIdx = updatedFiles.findIndex((f) => f.path === 'supabase/schema.sql' || f.path === 'schema.sql');
  if (existingSqlIdx >= 0) {
    updatedFiles[existingSqlIdx] = {
      ...updatedFiles[existingSqlIdx],
      content: sqlContent,
      isModified: true,
    };
  } else {
    updatedFiles.push({
      id: 'file-schema-sql-' + Date.now(),
      name: 'schema.sql',
      path: 'supabase/schema.sql',
      content: sqlContent,
      language: 'plaintext',
      isModified: true,
    });
  }

  // 2. Fichier TypeScript : src/types/database.ts
  const existingTsIdx = updatedFiles.findIndex((f) => f.path === 'src/types/database.ts' || f.path === 'types/database.ts');
  if (existingTsIdx >= 0) {
    updatedFiles[existingTsIdx] = {
      ...updatedFiles[existingTsIdx],
      content: tsContent,
      isModified: true,
    };
  } else {
    updatedFiles.push({
      id: 'file-database-ts-' + Date.now(),
      name: 'database.ts',
      path: 'src/types/database.ts',
      content: tsContent,
      language: 'typescript',
      isModified: true,
    });
  }

  return {
    ...project,
    files: updatedFiles,
    updatedAt: new Date().toISOString(),
  };
}
