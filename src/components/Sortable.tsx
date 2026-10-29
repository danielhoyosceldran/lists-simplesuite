import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode, type Ref,
} from 'react';
import {
  closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, rectSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/** Returns true right after a drag or long-press, so the click that follows the release is ignored. */
const DragGuardContext = createContext<() => boolean>(() => false);
export const useDragGuard = () => useContext(DragGuardContext);

interface SortableCollectionProps {
  /** Every rendered id, in DOM order. Ids not in `sortableIds` are rendered but can't be dragged or dropped on. */
  ids: string[];
  sortableIds?: string[];
  layout?: 'list' | 'grid';
  onReorder: (ids: string[]) => void;
  /** Long-press released without moving. */
  onHold?: (id: string) => void;
  children: ReactNode;
}

export function SortableCollection({ ids, sortableIds = ids, layout = 'list', onReorder, onHold, children }: SortableCollectionProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 350, tolerance: 8 } }),
  );
  const lastEnd = useRef(0);
  const guard = useCallback(() => performance.now() - lastEnd.current < 400, []);

  const handleEnd = ({ active, over, delta }: DragEndEvent) => {
    lastEnd.current = performance.now();
    const id = String(active.id);
    if (Math.hypot(delta.x, delta.y) < 6) {
      onHold?.(id);
      return;
    }
    if (!over || over.id === active.id) return;
    const from = sortableIds.indexOf(id);
    const to = sortableIds.indexOf(String(over.id));
    if (from !== -1 && to !== -1) onReorder(arrayMove(sortableIds, from, to));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => navigator.vibrate?.(8)}
      onDragEnd={handleEnd}
      onDragCancel={() => (lastEnd.current = performance.now())}
    >
      <SortableContext items={ids} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        <DragGuardContext.Provider value={guard}>{children}</DragGuardContext.Provider>
      </SortableContext>
    </DndContext>
  );
}

interface SortableSlotProps {
  id: string;
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode | ((state: { isDragging: boolean }) => ReactNode);
}

/** Plain wrapper that receives dnd-kit's transform, so inner motion elements stay free for their own animations. */
export function SortableSlot({ id, disabled, className, ref, children }: SortableSlotProps) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id, disabled });
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [setNodeRef, ref],
  );
  return (
    <div
      ref={setRefs}
      className={`slot${isDragging ? ' is-dragging' : ''}${className ? ` ${className}` : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...(disabled ? {} : listeners)}
    >
      {typeof children === 'function' ? children({ isDragging }) : children}
    </div>
  );
}

/**
 * Keeps a just-dropped order on screen until IndexedDB reports it back,
 * so items don't jump to their old place for a frame.
 */
export function useOptimisticOrder<T extends { id: string }>(items: T[]) {
  const [override, setOverride] = useState<string[] | null>(null);
  useEffect(() => setOverride(null), [items]);
  const sorted = useMemo(() => {
    if (!override) return items;
    const pos = new Map(override.map((id, i) => [id, i]));
    return [...items].sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
  }, [items, override]);
  return [sorted, setOverride] as const;
}

/** Stagger delay for elements present when a screen opens; later additions animate in without delay. */
export function useStagger() {
  const mountedAt = useRef(performance.now());
  return useCallback((index: number) => (performance.now() - mountedAt.current < 700 ? Math.min(index * 0.035, 0.35) : 0), []);
}
