import { AnimatePresence, motion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          className="update-bar"
          role="status"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        >
          <span>Update available</span>
          <button className="toast-action" onClick={() => updateServiceWorker(true)}>Reload</button>
          <button className="update-dismiss" aria-label="Dismiss" onClick={() => setNeedRefresh(false)}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
