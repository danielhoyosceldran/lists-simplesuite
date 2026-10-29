import { useEffect, useRef } from 'react';
import { motion, useSpring } from 'motion/react';

interface BadgeProps {
  name: string;
  size?: 'md' | 'lg';
  /** 0–1 share of checked items; fills the tile like a glass, with a little slosh when it changes. */
  progress?: number;
}

/** Soft accent tile with the entity's initial. */
export function Badge({ name, size = 'md', progress }: BadgeProps) {
  const initial = [...name.trim()][0]?.toUpperCase() ?? '•';
  // Jumps to the first known level so opening a screen doesn't refill the tile from empty.
  const level = useSpring(progress ?? 0, { stiffness: 180, damping: 13 });
  const known = useRef(progress !== undefined);
  useEffect(() => {
    if (progress === undefined) return;
    if (known.current) level.set(progress);
    else level.jump(progress);
    known.current = true;
  }, [level, progress]);
  return (
    <span className={`badge badge-${size}`} aria-hidden>
      {initial}
      {progress !== undefined && (
        <motion.span className="badge-fill" style={{ ['--p' as string]: level }}>
          {initial}
        </motion.span>
      )}
    </span>
  );
}
