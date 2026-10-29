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
}

export function Header({ title, eyebrow, layoutKey, color, back, crumbs, actions }: HeaderProps) {
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
          {layoutKey && <Badge id={layoutKey} name={title} size="lg" />}
          <motion.h1 className="title" layoutId={layoutKey ? `title-${layoutKey}` : undefined}>
            {title}
          </motion.h1>
        </div>
      </div>
    </header>
  );
}
