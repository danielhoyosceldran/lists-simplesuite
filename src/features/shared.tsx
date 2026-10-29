import { useRef } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { Page } from '../components/Page';
import { Header } from '../components/Header';

/**
 * Loads one record: undefined while loading, null if it doesn't exist.
 * Keeps showing the last known value once it disappears, so a screen deleting
 * its own entity doesn't flash "Not found" during its exit transition.
 */
export function useRecord<T>(query: () => Promise<T | undefined>, deps: unknown[]) {
  const value = useLiveQuery(async () => (await query()) ?? null, deps);
  const last = useRef<T | null>(null);
  if (value) last.current = value;
  return value === null && last.current ? last.current : value;
}

export function countBy<T>(rows: T[], key: (row: T) => string, include: (row: T) => boolean = () => true) {
  const counts: Record<string, number> = {};
  for (const row of rows) if (include(row)) counts[key(row)] = (counts[key(row)] ?? 0) + 1;
  return counts;
}

export const plural = (word: string) => (n: number) => (n === 1 ? word : `${word}s`);

/** Shown when a route points to something that no longer exists (deleted, or a stale link). */
export function NotFound({ back = '/' }: { back?: string }) {
  return (
    <Page>
      <Header title="Not found" back={back} />
      <div className="empty">
        <p className="empty-text">This was deleted or never existed on this device.</p>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </Page>
  );
}
