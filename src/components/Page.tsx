import { createContext, useContext, type ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

/** 1 = navigating deeper, -1 = going back, 0 = first load. */
export const DirectionContext = createContext(0);

const variants: Variants = {
  enter: (dir: number) => ({ x: dir === 0 ? 0 : dir > 0 ? '28%' : '-22%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-18%' : '28%', opacity: 0, pointerEvents: 'none' }),
};

const transition = {
  x: { type: 'spring', stiffness: 420, damping: 42, mass: 0.9 },
  opacity: { duration: 0.22, ease: 'easeOut' },
} as const;

export function Page({ children }: { children: ReactNode }) {
  const dir = useContext(DirectionContext);
  return (
    <motion.div className="page" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={transition}>
      <motion.main className="page-scroll" layoutScroll>
        <div className="page-inner">{children}</div>
      </motion.main>
    </motion.div>
  );
}
