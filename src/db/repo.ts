import type { Table } from 'dexie';
import { db } from './db';
import type { ColorKey, Entity, EntityKind, Item, List, Organization, Project } from './types';

type EntityTableOf = Table<Entity, string>;

export function tableFor(kind: EntityKind): EntityTableOf {
  if (kind === 'organization') return db.organizations as unknown as EntityTableOf;
  if (kind === 'project') return db.projects as unknown as EntityTableOf;
  return db.lists as unknown as EntityTableOf;
}

const uid = () => crypto.randomUUID();

function nextOrder(rows: { order: number }[]) {
  return rows.reduce((max, r) => Math.max(max, r.order), -1) + 1;
}

/* ---------- Queries ---------- */

export const getOrganizations = () => db.organizations.orderBy('order').toArray();
export const getProjects = (organizationId: string) =>
  db.projects.where('organizationId').equals(organizationId).sortBy('order');
export const getLists = (projectId: string) => db.lists.where('projectId').equals(projectId).sortBy('order');
export const getItems = (listId: string) => db.items.where('listId').equals(listId).toArray();

/* ---------- Containers ---------- */

export async function createOrganization(name: string, color: ColorKey) {
  const now = Date.now();
  return db.transaction('rw', db.organizations, async () => {
    const org: Organization = {
      id: uid(), name, color,
      order: nextOrder(await db.organizations.toArray()), createdAt: now, updatedAt: now,
    };
    await db.organizations.add(org);
    return org;
  });
}

export async function createProject(organizationId: string, name: string, color: ColorKey) {
  const now = Date.now();
  const project: Project = {
    id: uid(), organizationId, name, color,
    order: nextOrder(await getProjects(organizationId)), createdAt: now, updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

export async function createList(projectId: string, name: string, color: ColorKey) {
  const now = Date.now();
  const list: List = {
    id: uid(), projectId, name, color, showChecked: true,
    order: nextOrder(await getLists(projectId)), createdAt: now, updatedAt: now,
  };
  await db.lists.add(list);
  return list;
}

export function updateEntity(kind: EntityKind, id: string, changes: { name?: string; color?: ColorKey }) {
  return tableFor(kind).update(id, { ...changes, updatedAt: Date.now() });
}

export function setShowChecked(listId: string, showChecked: boolean) {
  return db.lists.update(listId, { showChecked, updatedAt: Date.now() });
}

/** Writes order = position for the given ids. */
export function reorder(kind: EntityKind | 'item', ids: string[]) {
  const table = (kind === 'item' ? db.items : tableFor(kind)) as Table<{ id: string; order: number }, string>;
  return db.transaction('rw', table, () => Promise.all(ids.map((id, order) => table.update(id, { order }))));
}

/** Collects every descendant id of a container, for cascade deletes and their confirmation. */
async function collectTree(kind: EntityKind, id: string) {
  const orgIds = kind === 'organization' ? [id] : [];
  const projectIds = kind === 'project' ? [id] : await db.projects.where('organizationId').anyOf(orgIds).primaryKeys();
  const listIds = kind === 'list' ? [id] : await db.lists.where('projectId').anyOf(projectIds).primaryKeys();
  const itemIds = await db.items.where('listId').anyOf(listIds).primaryKeys();
  return { orgIds, projectIds, listIds, itemIds };
}

export async function countDescendants(kind: EntityKind, id: string) {
  const t = await collectTree(kind, id);
  return {
    projects: kind === 'organization' ? t.projectIds.length : 0,
    lists: kind === 'list' ? 0 : t.listIds.length,
    items: t.itemIds.length,
  };
}

export function deleteEntity(kind: EntityKind, id: string) {
  return db.transaction('rw', [db.organizations, db.projects, db.lists, db.items], async () => {
    const t = await collectTree(kind, id);
    await db.items.bulkDelete(t.itemIds);
    await db.lists.bulkDelete(t.listIds);
    await db.projects.bulkDelete(t.projectIds);
    await db.organizations.bulkDelete(t.orgIds);
  });
}

/* ---------- Items ---------- */

export async function addItems(listId: string, texts: string[]) {
  const clean = texts.map((t) => t.trim()).filter(Boolean);
  if (!clean.length) return;
  const now = Date.now();
  // Read and write in one transaction so rapid consecutive adds can't share an order.
  await db.transaction('rw', db.items, async () => {
    let order = nextOrder(await getItems(listId));
    await db.items.bulkAdd(
      clean.map((text, i): Item => ({
        id: uid(), listId, text, checked: false, checkedAt: null,
        order: order++, createdAt: now + i, updatedAt: now + i,
      })),
    );
  });
}

export function toggleItem(item: Item) {
  const now = Date.now();
  return db.items.update(item.id, { checked: !item.checked, checkedAt: item.checked ? null : now, updatedAt: now });
}

export function updateItemText(id: string, text: string) {
  return db.items.update(id, { text: text.trim(), updatedAt: Date.now() });
}

export const deleteItem = (id: string) => db.items.delete(id);
export const restoreItem = (item: Item) => db.items.put(item);
