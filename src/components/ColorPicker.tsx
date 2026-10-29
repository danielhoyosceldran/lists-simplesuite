import { motion } from 'motion/react';
import { COLOR_KEYS, type ColorKey } from '../db/types';
import { COLOR_LABELS } from '../theme/palette';
import { CheckIcon } from './Icons';

interface ColorPickerProps {
  value: ColorKey;
  onChange: (color: ColorKey) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="color-picker" role="radiogroup" aria-label="Color">
      {COLOR_KEYS.map((key) => {
        const selected = key === value;
        return (
          <motion.button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={COLOR_LABELS[key]}
            className="swatch"
            style={{ background: `var(--c-${key})` }}
            whileTap={{ scale: 0.88 }}
            onClick={() => onChange(key)}
          >
            {selected && (
              <motion.span
                className="swatch-check"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 28 }}
              >
                <CheckIcon width={18} height={18} strokeWidth={3} />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
