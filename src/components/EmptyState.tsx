import { motion } from 'motion/react';
import { PlusIcon } from './Icons';

interface EmptyStateProps {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}

const bars = [
  { w: '78%', color: 'var(--c-indigo)', delay: 0 },
  { w: '62%', color: 'var(--c-teal)', delay: 0.25 },
  { w: '44%', color: 'var(--c-coral)', delay: 0.5 },
];

export function EmptyState({ title, text, action, onAction }: EmptyStateProps) {
  return (
    <motion.div
      className="empty"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="empty-art" aria-hidden>
        <span className="empty-glow" />
        <div className="empty-card">
          {bars.map((b, i) => (
            <motion.div
              key={i}
              className="empty-row"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
            >
              <motion.span
                className="empty-dot"
                style={{ background: b.color }}
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
              />
              <span className="empty-bar" style={{ width: b.w }} />
            </motion.div>
          ))}
        </div>
      </div>
      <h2 className="empty-title">{title}</h2>
      <p className="empty-text">{text}</p>
      {action && (
        <motion.button className="btn btn-primary" whileTap={{ scale: 0.96 }} onClick={onAction}>
          <PlusIcon width={18} height={18} /> {action}
        </motion.button>
      )}
    </motion.div>
  );
}
