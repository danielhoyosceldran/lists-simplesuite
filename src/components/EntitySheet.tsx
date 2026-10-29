import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { countDescendants, deleteEntity, updateEntity } from '../db/repo';
import type { ColorKey, Entity, EntityKind } from '../db/types';
import { accentStyle, randomColor } from '../theme/palette';
import { BottomSheet } from './BottomSheet';
import { ColorPicker } from './ColorPicker';

export const KIND_LABEL: Record<EntityKind, string> = {
  organization: 'organization',
  project: 'project',
  list: 'list',
};

export interface EntitySheetState {
  open: boolean;
  /** Present when editing; absent when creating. */
  entity?: Entity;
}

interface EntitySheetProps {
  kind: EntityKind;
  state: EntitySheetState;
  onClose: () => void;
  onCreate?: (name: string, color: ColorKey) => Promise<unknown>;
  onDeleted?: () => void;
}

export function EntitySheet({ kind, state, onClose, onCreate, onDeleted }: EntitySheetProps) {
  const editing = !!state.entity;
  const label = KIND_LABEL[kind];
  return (
    <BottomSheet open={state.open} onClose={onClose} title={editing ? `Edit ${label}` : `New ${label}`}>
      <EntityForm key={state.entity?.id ?? 'new'} kind={kind} entity={state.entity} onClose={onClose} onCreate={onCreate} onDeleted={onDeleted} />
    </BottomSheet>
  );
}

interface EntityFormProps extends Omit<EntitySheetProps, 'state'> {
  entity?: Entity;
}

function EntityForm({ kind, entity, onClose, onCreate, onDeleted }: EntityFormProps) {
  const [name, setName] = useState(entity?.name ?? '');
  const [color, setColor] = useState<ColorKey>(entity?.color ?? randomColor);
  const [confirm, setConfirm] = useState<string | null>(null);
  const label = KIND_LABEL[kind];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (entity) await updateEntity(kind, entity.id, { name: trimmed, color });
    else await onCreate?.(trimmed, color);
    onClose();
  };

  const askDelete = async () => {
    if (!entity) return;
    const c = await countDescendants(kind, entity.id);
    const parts = [
      c.projects && `${c.projects} project${c.projects === 1 ? '' : 's'}`,
      c.lists && `${c.lists} list${c.lists === 1 ? '' : 's'}`,
      c.items && `${c.items} item${c.items === 1 ? '' : 's'}`,
    ].filter(Boolean);
    setConfirm(parts.length ? `This also deletes ${parts.join(', ')}. This can't be undone.` : "This can't be undone.");
  };

  const doDelete = async () => {
    if (!entity) return;
    await deleteEntity(kind, entity.id);
    onClose();
    onDeleted?.();
  };

  return (
    <form className="sheet-body" style={accentStyle(color)} onSubmit={submit}>
      <label className="field">
        <span className="field-label">Name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${label[0].toUpperCase()}${label.slice(1)} name`}
          autoFocus={!entity}
          enterKeyHint="done"
          maxLength={120}
        />
      </label>
      <div className="field">
        <span className="field-label">Color</span>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {confirm ? (
          <motion.div key="confirm" className="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p>
              Delete <strong>{entity?.name}</strong>? {confirm}
            </p>
            <div className="sheet-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={doDelete}>Delete</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="actions" className="sheet-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {entity && (
              <button type="button" className="btn btn-ghost btn-danger-text" onClick={askDelete}>Delete</button>
            )}
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              {entity ? 'Save' : 'Create'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
