import type { CSSProperties } from 'react';
import { COLOR_KEYS, type ColorKey } from '../db/types';

export const COLOR_LABELS: Record<ColorKey, string> = {
  coral: 'Coral', amber: 'Amber', lime: 'Lime', teal: 'Teal',
  sky: 'Sky', indigo: 'Indigo', violet: 'Violet', rose: 'Rose',
};

/** Sets --accent for a subtree so components can tint themselves with the entity color. */
export const accentStyle = (color: ColorKey): CSSProperties => ({ ['--accent' as string]: `var(--c-${color})` });

export function randomColor(): ColorKey {
  return COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
}
