import { useState, type FormEvent } from 'react';
import type { Item } from '../../db/types';
import { updateItemText } from '../../db/repo';
import { BottomSheet } from '../../components/BottomSheet';

interface ItemSheetProps {
  item?: Item;
  open: boolean;
  onClose: () => void;
  onDelete: (item: Item) => void;
}

export function ItemSheet({ item, open, onClose, onDelete }: ItemSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Edit item">
      {item && <ItemForm key={item.id} item={item} onClose={onClose} onDelete={onDelete} />}
    </BottomSheet>
  );
}

function ItemForm({ item, onClose, onDelete }: { item: Item; onClose: () => void; onDelete: (item: Item) => void }) {
  const [text, setText] = useState(item.text);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    if (text.trim() !== item.text) await updateItemText(item.id, text);
    onClose();
  };

  return (
    <form className="sheet-body" onSubmit={submit}>
      <textarea
        className="input textarea"
        value={text}
        rows={3}
        autoFocus
        aria-label="Item text"
        enterKeyHint="done"
        onChange={(e) => setText(e.target.value.replace(/\r?\n/g, ' '))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        onFocus={(e) => e.currentTarget.setSelectionRange(text.length, text.length)}
      />
      <div className="sheet-actions">
        <button
          type="button"
          className="btn btn-ghost btn-danger-text"
          onClick={() => {
            onClose();
            onDelete(item);
          }}
        >
          Delete
        </button>
        <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Save</button>
      </div>
    </form>
  );
}
