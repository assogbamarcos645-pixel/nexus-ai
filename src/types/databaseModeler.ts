/**
 * src/types/databaseModeler.ts
 *
 * Types et interfaces pour le Studio de Modélisation de Base de Données
 * et générateur de schémas PostgreSQL / Supabase pour NEXUS LAB.
 */

export type DbColumnType =
  | 'uuid'
  | 'text'
  | 'varchar'
  | 'integer'
  | 'bigint'
  | 'numeric'
  | 'boolean'
  | 'timestamptz'
  | 'timestamp'
  | 'date'
  | 'jsonb'
  | 'bytea';

export interface DbColumn {
  id: string;
  name: string;
  type: DbColumnType;
  isPrimaryKey?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  isForeignKey?: boolean;
  referencesTable?: string; // Nom de la table cible
  referencesColumn?: string; // Nom de la colonne cible (généralement 'id')
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  comment?: string;
}

export interface DbTable {
  id: string;
  name: string;
  comment?: string;
  columns: DbColumn[];
  enableRls: boolean;
}

export interface DbRelation {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export type RlsAction = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
export type RlsRole = 'authenticated' | 'anon' | 'public';

export interface DbRlsPolicy {
  id: string;
  tableId: string;
  name: string;
  action: RlsAction;
  role: RlsRole;
  usingExpression: string; // e.g. "auth.uid() = user_id"
  checkExpression?: string;
}

export interface DbSchema {
  id: string;
  name: string;
  description?: string;
  tables: DbTable[];
  policies: DbRlsPolicy[];
}
