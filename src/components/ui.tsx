import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Card({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && <div className="card-title"><h2>{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export const More = ({ to, children = 'See all' }: { to: string; children?: ReactNode }) => <Link to={to}>{children} →</Link>;

export function PageHead({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
      {action}
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="between"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

export function Check({ on, onClick, round, label }: { on: boolean; onClick: () => void; round?: boolean; label: string }) {
  return <button className={`check ${on ? 'on' : ''} ${round ? 'round' : ''}`} onClick={onClick} aria-label={label} aria-pressed={on} />;
}
