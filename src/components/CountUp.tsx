import { useEffect } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

/** Animated number that counts from its previous value (React Bits-style counter). */
export function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span className="tabular">{rounded}</motion.span>;
}
