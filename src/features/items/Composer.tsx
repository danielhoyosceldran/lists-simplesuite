import { useLayoutEffect, useRef, useState } from 'react';
import { addItems } from '../../db/repo';
import { PlusIcon } from '../../components/Icons';

/**
 * Notepad-style input: every line break turns the text before it into an item.
 * Pasting several lines creates one item per non-empty line.
 */
export function Composer({ listId }: { listId: string }) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow for browsers without `field-sizing: content`.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || CSS.supports('field-sizing', 'content')) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleChange = (text: string) => {
    if (!/\r?\n/.test(text)) return setValue(text);
    const lines = text.split(/\r?\n/);
    const rest = lines.pop() ?? '';
    addItems(listId, lines);
    setValue(rest);
  };

  const flush = () => {
    if (!value.trim()) return;
    addItems(listId, [value]);
    setValue('');
  };

  return (
    <div className="composer" onClick={() => ref.current?.focus()}>
      <span className="composer-icon" aria-hidden>
        <PlusIcon width={18} height={18} />
      </span>
      <textarea
        ref={ref}
        className="composer-input"
        rows={1}
        value={value}
        placeholder="Add items, one per line"
        aria-label="Add items, one per line"
        enterKeyHint="enter"
        autoCapitalize="sentences"
        onChange={(e) => handleChange(e.target.value)}
        onBlur={flush}
        onKeyDown={(e) => e.key === 'Escape' && ref.current?.blur()}
      />
    </div>
  );
}
