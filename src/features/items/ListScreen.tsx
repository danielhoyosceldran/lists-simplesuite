import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { db } from '../../db/db';
import { deleteItem, getItems, reorder, restoreItem, setShowChecked, toggleItem } from '../../db/repo';
import type { Item } from '../../db/types';
import { EntitySheet, type EntitySheetState } from '../../components/EntitySheet';
import { Header } from '../../components/Header';
import { ChevronIcon, EyeIcon, EyeOffIcon, MoreIcon } from '../../components/Icons';
import { Page } from '../../components/Page';
import { SortableCollection, useOptimisticOrder, useStagger } from '../../components/Sortable';
import { useToast } from '../../components/Toast';
import { accentStyle } from '../../theme/palette';
import { NotFound, useRecord } from '../shared';
import { Composer } from './Composer';
import { ItemRow } from './ItemRow';
import { ItemSheet } from './ItemSheet';

export function ListScreen() {
  const { orgId = '', projectId = '', listId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const stagger = useStagger();

  const org = useRecord(() => db.organizations.get(orgId), [orgId]);
  const project = useRecord(() => db.projects.get(projectId), [projectId]);
  const list = useRecord(() => db.lists.get(listId), [listId]);
  const items = useLiveQuery(() => getItems(listId), [listId]);

  const [listSheet, setListSheet] = useState<EntitySheetState>({ open: false });
  const [itemSheet, setItemSheet] = useState<{ open: boolean; item?: Item }>({ open: false });

  // Unchecked keep their manual order; checked ones show the most recently checked first.
  const { unchecked, checked } = useMemo(() => {
    const all = items ?? [];
    return {
      unchecked: all.filter((i) => !i.checked).sort((a, b) => a.order - b.order),
      checked: all.filter((i) => i.checked).sort((a, b) => (b.checkedAt ?? 0) - (a.checkedAt ?? 0)),
    };
  }, [items]);
  const [ordered, setOverride] = useOptimisticOrder(unchecked);

  const handleDelete = useCallback(
    (item: Item) => {
      deleteItem(item.id);
      toast({ message: 'Item deleted', action: { label: 'Undo', onClick: () => restoreItem(item) } });
    },
    [toast],
  );

  if (org === null || project === null || list === null || (list && list.projectId !== projectId)) {
    return <NotFound />;
  }

  const projectPath = `/o/${orgId}/p/${projectId}`;
  const showChecked = list?.showChecked ?? true;
  const visibleChecked = showChecked ? checked : [];
  const rows = [...ordered, ...visibleChecked];
  const dep = `${rows.map((i) => i.id + (i.checked ? '+' : '-')).join()}|${showChecked}`;
  const rowProps = (item: Item, index: number) => ({
    item,
    dep,
    delay: stagger(index),
    onToggle: toggleItem,
    onEdit: (it: Item) => setItemSheet({ open: true, item: it }),
    onDelete: handleDelete,
  });

  return (
    <Page>
      {org && project && list && (
        <Header
          title={list.name}
          layoutKey={list.id}
          color={list.color}
          back={projectPath}
          crumbs={[
            { label: org.name, to: `/o/${orgId}` },
            { label: project.name, to: projectPath },
          ]}
          actions={
            <>
              <button
                className="icon-btn"
                aria-label={showChecked ? 'Hide checked items' : 'Show checked items'}
                aria-pressed={!showChecked}
                onClick={() => setShowChecked(list.id, !showChecked)}
              >
                {showChecked ? <EyeIcon /> : <EyeOffIcon />}
              </button>
              <button className="icon-btn" aria-label="Edit list" onClick={() => setListSheet({ open: true, entity: list })}>
                <MoreIcon />
              </button>
            </>
          }
        />
      )}

      {list && items && (
        <div className="items" style={accentStyle(list.color)}>
          <SortableCollection
            ids={rows.map((i) => i.id)}
            sortableIds={ordered.map((i) => i.id)}
            onReorder={(ids) => {
              setOverride(ids);
              reorder('item', ids);
            }}
            onHold={(id) => setItemSheet({ open: true, item: ordered.find((i) => i.id === id) })}
          >
            <div className="item-stack">
              <AnimatePresence mode="popLayout" initial={false}>
                {ordered.map((item, i) => (
                  <ItemRow key={item.id} {...rowProps(item, i)} />
                ))}

                <motion.div key="composer" layout="position" layoutDependency={dep}>
                  <Composer listId={list.id} />
                </motion.div>

                {checked.length > 0 && (
                  <motion.div
                    key="checked-header"
                    className="checked-header"
                    layout="position"
                    layoutDependency={dep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <button
                      className="checked-toggle"
                      aria-expanded={showChecked}
                      onClick={() => setShowChecked(list.id, !showChecked)}
                    >
                      <motion.span animate={{ rotate: showChecked ? 90 : 0 }} className="checked-chevron">
                        <ChevronIcon width={16} height={16} />
                      </motion.span>
                      {checked.length} checked
                    </button>
                  </motion.div>
                )}

                {visibleChecked.map((item, i) => (
                  <ItemRow key={item.id} {...rowProps(item, ordered.length + i)} />
                ))}
              </AnimatePresence>
            </div>
          </SortableCollection>

          {items.length === 0 && (
            <motion.p className="items-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              Type and press Enter — each line becomes an item. Tap an item to check it, swipe left to delete, hold to edit
              or drag.
            </motion.p>
          )}
        </div>
      )}

      <EntitySheet
        kind="list"
        state={listSheet}
        onClose={() => setListSheet((s) => ({ ...s, open: false }))}
        onDeleted={() => navigate(projectPath, { replace: true })}
      />
      <ItemSheet
        open={itemSheet.open}
        item={itemSheet.item}
        onClose={() => setItemSheet((s) => ({ ...s, open: false }))}
        onDelete={handleDelete}
      />
    </Page>
  );
}
