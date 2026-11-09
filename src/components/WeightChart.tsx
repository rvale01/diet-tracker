// Single series: weight over time. One hue, 2px line, 8px markers, tap/hover for the exact value.
import { useMemo, useState } from 'react';
import { fmtDay, parseKey } from '../lib/dates';
import type { Weight } from '../lib/types';

const W = 360, H = 170, PAD = { l: 34, r: 10, t: 10, b: 22 };

export default function WeightChart({ weights }: { weights: Weight[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = useMemo(() => [...weights].sort((a, b) => a.date.localeCompare(b.date)), [weights]);
  if (pts.length < 2) return <div className="empty">Log at least two weigh-ins to see the chart.</div>;

  const t0 = parseKey(pts[0].date).getTime(), t1 = parseKey(pts[pts.length - 1].date).getTime();
  const kgs = pts.map((p) => p.kg);
  const lo = Math.floor(Math.min(...kgs) - 0.5), hi = Math.ceil(Math.max(...kgs) + 0.5);
  const x = (d: string) => PAD.l + ((parseKey(d).getTime() - t0) / Math.max(t1 - t0, 1)) * (W - PAD.l - PAD.r);
  const y = (kg: number) => PAD.t + (1 - (kg - lo) / Math.max(hi - lo, 1)) * (H - PAD.t - PAD.b);
  const ticks = Array.from({ length: 4 }, (_, i) => lo + ((hi - lo) * i) / 3);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.kg).toFixed(1)}`).join('');
  const area = `${path}L${x(pts[pts.length - 1].date)},${H - PAD.b}L${x(pts[0].date)},${H - PAD.b}Z`;
  const h = hover !== null ? pts[hover] : null;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(x(p.date) - px) < Math.abs(x(pts[best].date) - px)) best = i; });
    setHover(best);
  };

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} role="img"
        aria-label={`Weight from ${pts[0].kg} kg to ${pts[pts.length - 1].kg} kg`}>
        <defs>
          <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#60a5fa" stopOpacity=".22" /><stop offset="1" stopColor="#60a5fa" stopOpacity="0" /></linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#2a3650" strokeWidth="1" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#64748b">{t.toFixed(t % 1 ? 1 : 0)}</text>
          </g>
        ))}
        <text x={PAD.l} y={H - 6} fontSize="10" fill="#64748b">{fmtDay(pts[0].date, { day: 'numeric', month: 'short' })}</text>
        <text x={W - PAD.r} y={H - 6} fontSize="10" fill="#64748b" textAnchor="end">{fmtDay(pts[pts.length - 1].date, { day: 'numeric', month: 'short' })}</text>
        <path d={area} fill="url(#wfill)" />
        <path d={path} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {h && <line x1={x(h.date)} x2={x(h.date)} y1={PAD.t} y2={H - PAD.b} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />}
        {pts.map((p, i) => (
          <circle key={p.date} cx={x(p.date)} cy={y(p.kg)} r={hover === i ? 6 : 4} fill="#60a5fa" stroke="#151e31" strokeWidth="2" />
        ))}
      </svg>
      {h && (
        <div className="tip" style={{ left: `${(x(h.date) / W) * 100}%`, top: `${(y(h.kg) / H) * 100}%` }}>
          <b>{h.kg} kg</b> <span className="muted">· {fmtDay(h.date, { day: 'numeric', month: 'short' })}</span>
        </div>
      )}
    </div>
  );
}
