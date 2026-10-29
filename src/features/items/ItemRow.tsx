import { useRef, type KeyboardEvent, type PointerEvent, type Ref } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import type { Item } from '../../db/types';
import { TrashIcon } from '../../components/Icons';
import { SortableSlot, useDragGuard } from '../../components/Sortable';

interface ItemRowProps {
  item: Item;
  delay: number;
  /** Layout signature of the whole list; rows only re-measure when it changes, not on every drag frame. */
  dep: string;
  onToggle: (item: Item) => void;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  ref?: Ref<HTMLDivElement>;
}

const SWIPE_START = 10;
const LONG_PRESS_MS = 450;

export function ItemRow({ item, delay, dep, onToggle, onEdit, onDelete, ref }: ItemRowProps) {
  const justDragged = useDragGuard();
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, -24, 0], [1, 0.35, 0]);
  const iconScale = useTransform(x, [-120, -40], [1, 0.7]);
  const gesture = useRef<{ x: number; y: number; width: number; swiping: boolean } | null>(null);
  const pointerType = useRef('mouse');
  const suppressClick = useRef(false);
  const pressTimer = useRef<number>(undefined);

  const suppress = () => {
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 150);
  };

  const endGesture = () => {
    window.clearTimeout(pressTimer.current);
    gesture.current = null;
  };

  return (
    <SortableSlot id={item.id} disabled={item.checked} ref={ref}>
      {({ isDragging }) => {
        const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
          pointerType.current = e.pointerType;
          if (e.button !== 0) return;
          gesture.current = { x: e.clientX, y: e.clientY, width: e.currentTarget.offsetWidth, swiping: false };
          // Unchecked rows get long-press from dnd-kit (hold & release); checked rows aren't sortable, so time it here.
          if (item.checked) {
            pressTimer.current = window.setTimeout(() => {
              navigator.vibrate?.(8);
              suppress();
              endGesture();
              onEdit(item);
            }, LONG_PRESS_MS);
          }
        };

        const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
          const g = gesture.current;
          if (!g) return;
          if (isDragging) return endGesture();
          const dx = e.clientX - g.x;
          const dy = e.clientY - g.y;
          if (!g.swiping) {
            if (Math.abs(dx) < SWIPE_START && Math.abs(dy) < SWIPE_START) return;
            window.clearTimeout(pressTimer.current);
            if (dx > -SWIPE_START || Math.abs(dx) < Math.abs(dy) * 1.2) return endGesture();
            g.swiping = true;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* pointer already released */
            }
          }
          x.set(Math.min(0, dx + SWIPE_START));
        };

        const onPointerUp = () => {
          const g = gesture.current;
          endGesture();
          if (!g?.swiping) return;
          suppress();
          if (x.get() < -Math.min(110, g.width * 0.33)) {
            navigator.vibrate?.(12);
            animate(x, -g.width, { duration: 0.18, ease: 'easeIn' }).then(() => onDelete(item));
          } else {
            animate(x, 0, { type: 'spring', stiffness: 520, damping: 36 });
          }
        };

        const onPointerCancel = () => {
          endGesture();
          animate(x, 0, { type: 'spring', stiffness: 520, damping: 36 });
        };

        const toggle = () => {
          if (suppressClick.current || justDragged()) return;
          if (!item.checked) navigator.vibrate?.(10);
          onToggle(item);
        };

        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggle(item);
          } else if (e.key === 'Delete' || e.key === 'Backspace') {
            onDelete(item);
          } else if (e.key === 'F2') {
            onEdit(item);
          }
        };

        return (
          <motion.div
            className="item"
            layout="position"
            layoutDependency={dep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay, type: 'spring', stiffness: 420, damping: 34 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <motion.div className="item-swipe-bg" style={{ opacity: bgOpacity }} aria-hidden>
              <motion.span style={{ scale: iconScale }}>
                <TrashIcon width={20} height={20} />
              </motion.span>
            </motion.div>
            <motion.div
              className="item-row"
              role="checkbox"
              aria-checked={item.checked}
              aria-label={item.text}
              aria-keyshortcuts="Space Delete F2"
              tabIndex={0}
              data-checked={item.checked}
              style={{ x }}
              whileTap={{ scale: 0.985 }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onClick={toggle}
              onKeyDown={onKeyDown}
              onContextMenu={(e) => {
                e.preventDefault();
                // Right-click on desktop; touch long-press is handled by the drag sensor / press timer.
                if (pointerType.current === 'mouse') {
                  endGesture();
                  onEdit(item);
                }
              }}
            >
              <span className="item-dot" aria-hidden />
              <span className="item-text">
                <span className="item-strike">{item.text}</span>
              </span>
            </motion.div>
          </motion.div>
        );
      }}
    </SortableSlot>
  );
}
