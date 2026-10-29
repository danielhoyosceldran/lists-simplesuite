export const COLOR_KEYS = ['coral', 'amber', 'lime', 'teal', 'sky', 'indigo', 'violet', 'rose'] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export interface Organization {
  id: string;
  name: string;
  color: ColorKey;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  color: ColorKey;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface List {
  id: string;
  projectId: string;
  name: string;
  color: ColorKey;
  order: number;
  showChecked: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Item {
  id: string;
  listId: string;
  text: string;
  checked: boolean;
  order: number;
  checkedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/** The three container levels share name/color/order and the same screens. */
export type EntityKind = 'organization' | 'project' | 'list';
export type Entity = Organization | Project | List;
