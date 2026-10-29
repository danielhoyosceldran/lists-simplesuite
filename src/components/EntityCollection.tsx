import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { reorder } from '../db/repo';
import type { ColorKey, Entity, EntityKind } from '../db/types';
import { accentStyle } from '../theme/palette';
import { Badge } from './Badge';
import { CountUp } from './CountUp';
import { EmptyState } from './EmptyState';
import { EntitySheet, KIND_LABEL, type EntitySheetState } from './EntitySheet';
import { ChevronIcon, MoreIcon, PlusIcon } from './Icons';
import { SortableCollection, SortableSlot, useDragGuard, useOptimisticOrder, useStagger } from './Sortable';

interface EntityCollectionProps<T extends Entity> {
  kind: EntityKind;
  /** Must be referentially stable between renders (straight from useLiveQuery). */
  entities: T[];
  counts: Record<string, number>;
  /** Share of checked items per entity, shown as a fill in its badge. */
  progress?: Record<string, number>;
  countLabel: (n: number) => string;
  hrefFor: (entity: T) => string;
  onCreate: (name: string, color: ColorKey) => Promise<unknown>;
  emptyTitle: string;
  emptyText: string;
}

/** Card grid shared by the organization, project and list screens: open, create, edit, delete, reorder. */
export function EntityCollection<T extends Entity>(props: EntityCollectionProps<T>) {
  const { kind, entities, counts, progress, countLabel, hrefFor, onCreate, emptyTitle, emptyText } = props;
  const [sorted, setOverride] = useOptimisticOrder(entities);
  const [sheet, setSheet] = useState<EntitySheetState>({ open: false });
  const stagger = useStagger();
  const ids = sorted.map((e) => e.id);
  const dep = ids.join();

  const create = () => setSheet({ open: true });
  const edit = (id: string) => setSheet({ open: true, entity: sorted.find((e) => e.id === id) });

  return (
    <>
      {sorted.length === 0 ? (
        <EmptyState title={emptyTitle} text={emptyText} action={`New ${KIND_LABEL[kind]}`} onAction={create} />
      ) : (
        <SortableCollection
          ids={ids}
          layout="grid"
          onReorder={(next) => {
            setOverride(next);
            reorder(kind, next);
          }}
          onHold={edit}
        >
          <div className="cards">
            <AnimatePresence mode="popLayout" initial={false}>
              {sorted.map((entity, i) => (
                <SortableSlot key={entity.id} id={entity.id}>
                  <Card
                    entity={entity}
                    count={counts[entity.id] ?? 0}
                    progress={progress?.[entity.id]}
                    countLabel={countLabel}
                    href={hrefFor(entity)}
                    delay={stagger(i)}
                    dep={dep}
                    onMenu={() => edit(entity.id)}
                  />
                </SortableSlot>
              ))}
            </AnimatePresence>
          </div>
        </SortableCollection>
      )}

      <motion.button
        className="fab"
        aria-label={`New ${KIND_LABEL[kind]}`}
        onClick={create}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.15 }}
      >
        <PlusIcon width={26} height={26} />
      </motion.button>

      <EntitySheet kind={kind} state={sheet} onClose={() => setSheet((s) => ({ ...s, open: false }))} onCreate={onCreate} />
    </>
  );
}

interface CardProps {
  entity: Entity;
  count: number;
  progress?: number;
  countLabel: (n: number) => string;
  href: string;
  delay: number;
  dep: string;
  onMenu: () => void;
}

function Card({ entity, count, progress, countLabel, href, delay, dep, onMenu }: CardProps) {
  const navigate = useNavigate();
  const justDragged = useDragGuard();
  return (
    <motion.div
      className="card"
      style={accentStyle(entity.color)}
      layout="position"
      layoutDependency={dep}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { delay, type: 'spring', stiffness: 380, damping: 32 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
    >
      <motion.button
        className="card-main"
        whileTap={{ scale: 0.98 }}
        onClick={() => !justDragged() && navigate(href)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Badge id={entity.id} name={entity.name} progress={progress} />
        <span className="card-text">
          <motion.span className="card-title" layoutId={`title-${entity.id}`}>
            {entity.name}
          </motion.span>
          <span className="card-meta">
            <CountUp value={count} /> {countLabel(count)}
          </span>
        </span>
        <ChevronIcon className="card-chevron" width={18} height={18} />
      </motion.button>
      <button
        className="icon-btn card-menu"
        aria-label={`Options for ${entity.name}`}
        onClick={() => !justDragged() && onMenu()}
      >
        <MoreIcon />
      </button>
    </motion.div>
  );
}
