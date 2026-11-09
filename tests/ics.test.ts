import { describe, expect, it, vi } from 'vitest';
import { feedEvents } from '../server/ics';

const ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
BEGIN:VTIMEZONE
TZID:Europe/London
BEGIN:DAYLIGHT
TZOFFSETFROM:+0000
TZOFFSETTO:+0100
TZNAME:BST
DTSTART:19700329T010000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0100
TZOFFSETTO:+0000
TZNAME:GMT
DTSTART:19701025T020000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:karate@test
SUMMARY:Karate
DTSTART;TZID=Europe/London:20261020T190000
DTEND;TZID=Europe/London:20261020T203000
RRULE:FREQ=WEEKLY;BYDAY=TU
EXDATE;TZID=Europe/London:20261117T190000
END:VEVENT
BEGIN:VEVENT
UID:karate@test
RECURRENCE-ID;TZID=Europe/London:20261124T190000
SUMMARY:Karate (grading)
DTSTART;TZID=Europe/London:20261124T180000
DTEND;TZID=Europe/London:20261124T200000
END:VEVENT
BEGIN:VEVENT
UID:holiday@test
SUMMARY:Trip
DTSTART;VALUE=DATE:20261127
DTEND;VALUE=DATE:20261130
LOCATION:Rome
END:VEVENT
BEGIN:VEVENT
UID:old@test
SUMMARY:Old
DTSTART:20250101T100000Z
DTEND:20250101T110000Z
END:VEVENT
END:VCALENDAR`;

describe('ics feeds', () => {
  it('expands weekly events with exceptions, DST and all-day events', async () => {
    vi.stubGlobal('fetch', async () => new Response(ICS));
    const ev = await feedEvents('webcal://example.com/a.ics', 'g', new Date('2026-11-09T00:00:00Z'), new Date('2026-12-01T00:00:00Z'));
    const karate = ev.filter((e) => e.title.startsWith('Karate'));
    expect(karate.map((e) => e.start)).toEqual([
      '2026-11-10T19:00:00.000Z', // GMT after clocks change: 19:00 local = 19:00Z
      '2026-11-24T18:00:00.000Z', // moved occurrence (17 Nov is cancelled)
    ]);
    expect(karate[1].title).toBe('Karate (grading)');
    const trip = ev.find((e) => e.title === 'Trip')!;
    expect(trip).toMatchObject({ allDay: true, start: '2026-11-27', end: '2026-11-30', location: 'Rome' });
    expect(ev.some((e) => e.title === 'Old')).toBe(false);
  });
});
