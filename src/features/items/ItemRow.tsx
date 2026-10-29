import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type Ref } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
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
/** The check plays in place before the row moves, so the eye sees it land. */
const INK_MS = { check: 300, uncheck: 150 };

/** Lift and carry: the checked row rides above its neighbours on a slightly springy path. */
const travel = { type: 'spring', visualDuration: 0.55, bounce: 0.16 } as const;

export function ItemRow({ item, delay, dep, onToggle, onEdit, onDelete, ref }: ItemRowProps) {
  const justDragged = useDragGuard();
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-120, -24, 0], [1, 0.35, 0]);
  const iconScale = useTransform(x, [-120, -40], [1, 0.7]);
  const gesture = useRef<{ x: number; y: number; width: number; swiping: boolean } | null>(null);
  const reduced = useReducedMotion();

  // Checked state shown on screen; leads the stored one by INK_MS while the check draws.
  const [pending, setPending] = useState<boolean | null>(null);
  const [ink, setInk] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [armed, setArmed] = useState(false);
  const commitTimer = useRef<number>(undefined);
  const inkTimer = useRef<number>(undefined);
  const liftTimer = useRef<number>(undefined);
  const checked = pending ?? item.checked;

  useEffect(() => setPending(null), [item.checked]);
  useEffect(
    () => () => [commitTimer, inkTimer, liftTimer].forEach((t) => window.clearTimeout(t.current)),
    [],
  );

  // A haptic detent where releasing the swipe would delete.
  useMotionValueEvent(x, 'change', (v) => {
    const g = gesture.current;
    if (!g?.swiping) return;
    const next = v < -swipeThreshold(g.width);
    if (next !== armed) {
      if (next) navigator.vibrate?.(6);
      setArmed(next);
    }
  });

  const flip = () => {
    // A second tap while the check is still drawing takes it back.
    if (pending !== null) {
      window.clearTimeout(commitTimer.current);
      setPending(null);
      setInk(false);
      return;
    }
    const next = !item.checked;
    if (next) navigator.vibrate?.(10);
    if (reduced) return onToggle(item);
    setPending(next);
    if (next) {
      setInk(true);
      window.clearTimeout(inkTimer.current);
      inkTimer.current = window.setTimeout(() => setInk(false), 700);
    }
    commitTimer.current = window.setTimeout(
      () => {
        setLifted(true);
        window.clearTimeout(liftTimer.current);
        liftTimer.current = window.setTimeout(() => setLifted(false), 1000);
        onToggle(item);
      },
      next ? INK_MS.check : INK_MS.uncheck,
    );
  };
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
    <SortableSlot id={item.id} disabled={item.checked} className={lifted ? 'is-lifted' : undefined} ref={ref}>
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
          setArmed(false);
          if (x.get() < -swipeThreshold(g.width)) {
            navigator.vibrate?.(12);
            animate(x, -g.width, { duration: 0.18, ease: 'easeIn' }).then(() => onDelete(item));
          } else {
            animate(x, 0, { type: 'spring', stiffness: 520, damping: 36 });
          }
        };

        const onPointerCancel = () => {
          endGesture();
          setArmed(false);
          animate(x, 0, { type: 'spring', stiffness: 520, damping: 36 });
        };

        const toggle = () => {
          if (suppressClick.current || justDragged()) return;
          flip();
        };

        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            flip();
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
            data-lifted={lifted || undefined}
            initial={{ opacity: 0, y: 10, filter: 'blur(3px)' }}
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              scale: lifted && !reduced ? 1.025 : 1,
              transition: { delay, type: 'spring', stiffness: 420, damping: 34 },
            }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ layout: travel }}
            onLayoutAnimationComplete={() => setLifted(false)}
          >
            <motion.div className="item-swipe-bg" data-armed={armed} style={{ opacity: bgOpacity }} aria-hidden>
              <motion.span style={{ scale: iconScale }}>
                <motion.span
                  className="item-swipe-icon"
                  animate={{ scale: armed ? 1.2 : 1, rotate: armed ? -8 : 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 18 }}
                >
                  <TrashIcon width={20} height={20} />
                </motion.span>
              </motion.span>
            </motion.div>
            <motion.div
              className="item-row"
              role="checkbox"
              aria-checked={checked}
              aria-label={item.text}
              aria-keyshortcuts="Space Delete F2"
              tabIndex={0}
              data-checked={checked}
              data-ink={ink || undefined}
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
              <span className="item-check" aria-hidden>
                <span className="item-check-fill" />
                <svg className="item-check-mark" viewBox="0 0 20 20" width="20" height="20">
                  <path d="m5.6 10.4 2.9 2.9 5.9-6.4" pathLength={1} />
                </svg>
              </span>
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

const swipeThreshold = (width: number) => Math.min(110, width * 0.33);
