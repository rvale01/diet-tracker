import { Link } from 'react-router-dom';
import { fmtDay } from '../lib/dates';
import { useStore } from '../lib/store';
import { describe, useWeather } from '../lib/weather';
import { Card } from './ui';

const DEFAULT = { name: 'London', lat: 51.5074, lon: -0.1278 };

export default function WeatherCard({ big }: { big?: boolean }) {
  const { settings } = useStore();
  const loc = settings.weather ?? DEFAULT;
  const { weather: w, error } = useWeather(loc);
  return (
    <Card title={`Weather · ${loc.name.split(',')[0]}`} action={!settings.weather && <Link to="/settings">Set location →</Link>}>
      {!w ? <div className="empty">{error ?? 'Loading…'}</div> : (
        <>
          <div className="weather-now">
            <div className="big">{describe(w.current.code, w.current.isDay).icon}</div>
            <div>
              <div className="temp num">{Math.round(w.current.temp)}°</div>
              <div className="muted small">{describe(w.current.code).label} · feels {Math.round(w.current.feels)}°</div>
            </div>
            <div className="grow" />
            <div className="small muted" style={{ textAlign: 'right' }}>
              <div>↑ {Math.round(w.daily[0].max)}° ↓ {Math.round(w.daily[0].min)}°</div>
              <div>☔ {w.daily[0].rain}%</div>
            </div>
          </div>
          <div className="hours">
            {w.hourly.map((h) => (
              <div className="hour" key={h.time}>
                <div className="t">{h.time.slice(11, 16)}</div>
                <div className="i">{describe(h.code).icon}</div>
                <div className="num">{Math.round(h.temp)}°</div>
                <div className="r">{h.rain >= 10 ? `${h.rain}%` : ' '}</div>
              </div>
            ))}
          </div>
          {big && (
            <div className="days5">
              {w.daily.map((d) => (
                <div key={d.date}>
                  <div className="faint tiny">{fmtDay(d.date, { weekday: 'short' })}</div>
                  <div style={{ fontSize: '1.2rem' }}>{describe(d.code).icon}</div>
                  <div className="num">{Math.round(d.max)}° <span className="faint">{Math.round(d.min)}°</span></div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
