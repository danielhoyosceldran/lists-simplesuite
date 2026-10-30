import { createContext, useContext, type ReactNode } from 'react';
import { motion, useIsPresent, usePresenceData, useReducedMotion, type Transition, type Variants } from 'motion/react';

/** 1 = navigating deeper, -1 = going back, 0 = first load. */
export const DirectionContext = createContext(0);

/**
 * Navigation stack: the deeper page is a solid sheet that slides fully over its parent, while the
 * parent recedes a third of the way with parallax and sinks under a dim. Going back peels the sheet
 * off to the right. Both pages share one spring so they move as a single physical system.
 * Wide screens travel a shorter distance and crossfade; reduced motion crossfades only.
 *
 * Variants only move pixels. Blocking input on a leaving page is presence state, not a variant:
 * a page that is navigated back to mid-exit re-enters the same element, and a style set by `exit`
 * would survive into `center` and leave the only page on screen deaf to taps.
 */
const stack = (wide: boolean): Variants => ({
  enter: (dir: number) =>
    dir === 0
      ? { x: 0, opacity: 0, zIndex: 1 }
      : dir > 0
        ? { x: wide ? '12%' : '100%', opacity: wide ? 0 : 1, zIndex: 2 }
        : { x: wide ? '-6%' : '-30%', opacity: wide ? 0 : 1, zIndex: 1 },
  center: { x: 0, opacity: 1 },
  exit: (dir: number) =>
    dir >= 0
      ? { x: wide ? '-6%' : '-30%', opacity: wide ? 0 : 1, zIndex: 1 }
      : { x: wide ? '12%' : '100%', opacity: wide ? 0 : 1, zIndex: 2 },
});

const fade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/** The parent page darkens as it is covered and brightens as it is uncovered. */
const dim: Variants = {
  enter: (dir: number) => ({ opacity: dir < 0 ? 1 : 0 }),
  center: { opacity: 0 },
  exit: (dir: number) => ({ opacity: dir >= 0 ? 1 : 0 }),
};

const push: Transition = { type: 'spring', visualDuration: 0.46, bounce: 0, opacity: { duration: 0.2, ease: 'easeOut' } };
const pop: Transition = { type: 'spring', visualDuration: 0.36, bounce: 0, opacity: { duration: 0.18, ease: 'easeOut' } };

/** The dim tracks the slide itself, so it uses the bare spring without the opacity override. */
const dimPush: Transition = { type: 'spring', visualDuration: 0.46, bounce: 0 };
const dimPop: Transition = { type: 'spring', visualDuration: 0.36, bounce: 0 };

const isWide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

export function Page({ children }: { children: ReactNode }) {
  // An exiting page keeps its old props; AnimatePresence hands it the latest direction instead.
  const presenceDir = usePresenceData() as number | undefined;
  const contextDir = useContext(DirectionContext);
  const dir = presenceDir ?? contextDir;
  // Inert while leaving: no taps, focus or screen-reader reach. Cleared the moment the page re-enters.
  const present = useIsPresent();
  const reduced = useReducedMotion();
  const variants = reduced ? fade : stack(isWide());
  return (
    <motion.div
      className="page"
      custom={dir}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={dir < 0 ? pop : push}
      inert={!present}
    >
      <motion.main className="page-scroll" layoutScroll>
        <div className="page-inner">{children}</div>
      </motion.main>
      {!reduced && <motion.div className="page-dim" variants={dim} custom={dir} transition={dir < 0 ? dimPop : dimPush} aria-hidden />}
    </motion.div>
  );
}
