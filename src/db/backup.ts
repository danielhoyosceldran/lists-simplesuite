import type { EntityTable } from 'dexie';
import { db, SCHEMA_VERSION } from './db';
import { COLOR_KEYS, type Item, type List, type Organization, type Project } from './types';

export interface BackupData {
  organizations: Organization[];
  projects: Project[];
  lists: List[];
  items: Item[];
}

export interface BackupFile {
  app: 'simple-lists';
  schemaVersion: number;
  exportedAt: string;
  data: BackupData;
}

export type ImportMode = 'replace' | 'merge';

export async function exportBackup(): Promise<BackupFile> {
  const [organizations, projects, lists, items] = await Promise.all([
    db.organizations.toArray(), db.projects.toArray(), db.lists.toArray(), db.items.toArray(),
  ]);
  return {
    app: 'simple-lists',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { organizations, projects, lists, items },
  };
}

export async function downloadBackup() {
  const backup = await exportBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `simple-lists-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Validation ---------- */

type Row = Record<string, unknown>;
const isObj = (v: unknown): v is Row => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown) => typeof v === 'string';
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const color = (v: unknown) => (COLOR_KEYS as readonly unknown[]).includes(v);
const base = (r: Row) => str(r.id) && num(r.order) && num(r.createdAt) && num(r.updatedAt);
const container = (r: Row) => base(r) && str(r.name) && color(r.color);

function checkArray(value: unknown, name: string, valid: (r: Row) => boolean) {
  if (!Array.isArray(value)) throw new Error(`Missing "${name}" in the backup.`);
  const bad = value.findIndex((r) => !isObj(r) || !valid(r));
  if (bad !== -1) throw new Error(`Invalid entry in "${name}" (position ${bad + 1}).`);
}

/** Parses and validates a backup file. Throws an Error with a user-facing message. */
export function parseBackup(text: string): BackupFile {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  if (!isObj(json) || json.app !== 'simple-lists' || !isObj(json.data)) {
    throw new Error('This file is not a Simple Lists backup.');
  }
  if (!num(json.schemaVersion)) throw new Error('The backup has no schema version.');
  if ((json.schemaVersion as number) > SCHEMA_VERSION) {
    throw new Error(`This backup was made by a newer version of the app (schema ${json.schemaVersion}). Update the app first.`);
  }
  const d = json.data;
  checkArray(d.organizations, 'organizations', container);
  checkArray(d.projects, 'projects', (r) => container(r) && str(r.organizationId));
  checkArray(d.lists, 'lists', (r) => container(r) && str(r.projectId) && typeof r.showChecked === 'boolean');
  checkArray(d.items, 'items', (r) =>
    base(r) && str(r.listId) && str(r.text) && typeof r.checked === 'boolean' && (r.checkedAt === null || num(r.checkedAt)),
  );

  const data = d as unknown as BackupData;
  const orgIds = new Set(data.organizations.map((o) => o.id));
  const projectIds = new Set(data.projects.map((p) => p.id));
  const listIds = new Set(data.lists.map((l) => l.id));
  if (data.projects.some((p) => !orgIds.has(p.organizationId))) throw new Error('A project points to a missing organization.');
  if (data.lists.some((l) => !projectIds.has(l.projectId))) throw new Error('A list points to a missing project.');
  if (data.items.some((i) => !listIds.has(i.listId))) throw new Error('An item points to a missing list.');

  return json as unknown as BackupFile;
}

/* ---------- Import ---------- */

/** Merge by id: keeps whichever copy of each record was updated most recently. */
async function mergeInto<T extends { id: string; updatedAt: number }>(table: EntityTable<T, 'id'>, rows: T[]) {
  const existing = await table.bulkGet(rows.map((r) => r.id) as Parameters<typeof table.bulkGet>[0]);
  await table.bulkPut(rows.filter((r, i) => !existing[i] || existing[i]!.updatedAt < r.updatedAt));
}

export function importBackup(backup: BackupFile, mode: ImportMode) {
  const { organizations, projects, lists, items } = backup.data;
  return db.transaction('rw', [db.organizations, db.projects, db.lists, db.items], async () => {
    if (mode === 'replace') {
      await Promise.all([db.organizations.clear(), db.projects.clear(), db.lists.clear(), db.items.clear()]);
    }
    await mergeInto(db.organizations, organizations);
    await mergeInto(db.projects, projects);
    await mergeInto(db.lists, lists);
    await mergeInto(db.items, items);
  });
}
