import Dexie, { type EntityTable } from 'dexie';
import type { Item, List, Organization, Project } from './types';

export const SCHEMA_VERSION = 1;

class ListsDB extends Dexie {
  organizations!: EntityTable<Organization, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  lists!: EntityTable<List, 'id'>;
  items!: EntityTable<Item, 'id'>;

  constructor() {
    super('simple-lists');
    // Schema changes: add this.version(2).stores(...).upgrade(...) below and bump SCHEMA_VERSION.
    this.version(1).stores({
      organizations: 'id, order',
      projects: 'id, organizationId, order',
      lists: 'id, projectId, order',
      items: 'id, listId, order',
    });
  }
}

export const db = new ListsDB();
