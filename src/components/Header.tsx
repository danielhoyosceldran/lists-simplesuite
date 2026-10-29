import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { ColorKey } from '../db/types';
import { accentStyle } from '../theme/palette';
import { BackIcon } from './Icons';
import { Badge } from './Badge';

interface Crumb {
  label: string;
  to: string;
}

interface HeaderProps {
  title: string;
  eyebrow?: string;
  /** Entity id; shares the badge/title layout with the card that opened this screen. */
  layoutKey?: string;
  color?: ColorKey;
  back?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** 0–1, fills the badge. */
  progress?: number;
  /** Short line under the title, announced politely when it changes. */
  status?: string;
  /** Increments each time the list is completed; every new value plays the completion bloom once. */
  celebrate?: number;
}

export function Header({ title, eyebrow, layoutKey, color, back, crumbs, actions, progress, status, celebrate }: HeaderProps) {
  return (
    <header className="header" style={color ? accentStyle(color) : undefined}>
      <div className="header-bar">
        {back ? (
          <Link to={back} className="icon-btn" aria-label="Back">
            <BackIcon />
          </Link>
        ) : (
          <span />
        )}
        <div className="header-actions">{actions}</div>
      </div>
      <div className="header-titles">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="crumbs">
            {crumbs.map((c, i) => (
              <span key={c.to}>
                {i > 0 && <span className="crumb-sep" aria-hidden>/</span>}
                <Link to={c.to}>{c.label}</Link>
              </span>
            ))}
          </nav>
        )}
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <div className="title-row">
          {layoutKey && <Badge id={layoutKey} name={title} size="lg" progress={progress} />}
          <div className="title-stack">
            <motion.h1 className="title" layoutId={layoutKey ? `title-${layoutKey}` : undefined}>
              {title}
            </motion.h1>
            {status !== undefined && (
              <p className="title-status" aria-live="polite">
                {status}
              </p>
            )}
          </div>
          {celebrate ? <Bloom key={celebrate} /> : null}
        </div>
      </div>
    </header>
  );
}

/** One soft burst of the accent from the badge: a widening ring over a fading wash. */
function Bloom() {
  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <span className="bloom" aria-hidden>
      <motion.span
        className="bloom-wash"
        initial={{ scale: 0.1, opacity: 0.85 }}
        animate={{ scale: 1, opacity: 0 }}
        transition={{ scale: { duration: 1.1, ease }, opacity: { duration: 1.2, ease: 'easeOut', delay: 0.1 } }}
      />
      <motion.span
        className="bloom-ring"
        initial={{ scale: 0.15, opacity: 1 }}
        animate={{ scale: 1, opacity: 0 }}
        transition={{ scale: { duration: 0.9, ease }, opacity: { duration: 0.9, ease: 'easeIn' } }}
      />
    </span>
  );
}
