import { motion } from 'motion/react';

interface BadgeProps {
  id: string;
  name: string;
  size?: 'md' | 'lg';
}

/** Soft accent tile with the entity's initial. Shared via layoutId between card and header. */
export function Badge({ id, name, size = 'md' }: BadgeProps) {
  const initial = [...name.trim()][0]?.toUpperCase() ?? '•';
  return (
    <motion.span layoutId={`badge-${id}`} className={`badge badge-${size}`} aria-hidden>
      {initial}
    </motion.span>
  );
}
