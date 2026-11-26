import Link from "next/link";
import cal from "./calendar.module.css";
import {
  addDays,
  dayOfMonth,
  isWeekend,
  monthName,
  timeRange,
  weekdayIndex,
  weekdayShort,
  type ModuleTone,
} from "./format";

export type CalendarBlock = {
  id: number;
  date: string;
  start: string;
  end: string;
  title: string;
  teacher?: string;
  tone: ModuleTone;
  assessment?: string;
  href?: string;
};

export type CalendarDayEvent = { date: string; title: string };

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export function WeekCalendar({
  days,
  blocks,
  events,
  today,
  now,
  fromHour = 8,
  toHour = 16,
  hourHeight = 64,
}: {
  days: string[];
  blocks: CalendarBlock[];
  events: CalendarDayEvent[];
  today: string;
  now: string;
  fromHour?: number;
  toHour?: number;
  hourHeight?: number;
}) {
  const hours = Array.from({ length: toHour - fromHour }, (_, i) => fromHour + i);
  const top = (t: string) => ((toMinutes(t) - fromHour * 60) / 60) * hourHeight;

  return (
    <div className={cal.week} style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))` }}>
      <div />
      {days.map((d) => (
        <div key={d} className={cal.weekHead}>
          <span className={cal.weekDayName}>{weekdayShort(d)}</span>
          <span className={cx(cal.weekDayNumber, d === today && cal.weekDayToday)}>{dayOfMonth(d)}</span>
          {events
            .filter((e) => e.date === d)
            .map((e) => (
              <span key={e.title} className={cal.allDay}>
                {e.title}
              </span>
            ))}
        </div>
      ))}
      <div className={cal.hours} style={{ height: hours.length * hourHeight }}>
        {hours.map((h) => (
          <span key={h} style={{ top: (h - fromHour) * hourHeight }}>
            {h}:00
          </span>
        ))}
      </div>
      {days.map((d) => (
        <div
          key={d}
          className={cal.weekColumn}
          style={{ height: hours.length * hourHeight, backgroundSize: `100% ${hourHeight}px` }}
        >
          {blocks
            .filter((b) => b.date === d)
            .map((b) => {
              const content = (
                <>
                  {b.assessment && <span aria-hidden="true">📝 </span>}
                  <strong>{b.title}</strong>
                  <span>
                    {timeRange(b.start, b.end)}
                    {b.teacher && ` · ${b.teacher}`}
                    {b.assessment && ` · ${b.assessment}`}
                  </span>
                </>
              );
              const style = { top: top(b.start) + 2, height: top(b.end) - top(b.start) - 4 };
              const className = cx(cal.block, cal[b.tone], b.assessment && cal.blockTest);
              return b.href ? (
                <Link key={b.id} href={b.href} className={className} style={style}>
                  {content}
                </Link>
              ) : (
                <div key={b.id} className={className} style={style}>
                  {content}
                </div>
              );
            })}
          {d === today && <span className={cal.nowLine} style={{ top: top(now) }} />}
        </div>
      ))}
    </div>
  );
}

function monthCells(month: string) {
  const first = `${month}-01`;
  const lead = (weekdayIndex(first) + 6) % 7;
  const start = addDays(first, -lead);
  const cells: string[] = [];
  for (let d = start; d.startsWith(month) || cells.length % 7 !== 0 || cells.length === 0; d = addDays(d, 1)) {
    cells.push(d);
  }
  return cells;
}

const WEEK_LETTERS = ["L", "M", "M", "G", "V", "S", "D"];
const WEEK_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export const monthTitle = (month: string) => {
  const name = monthName(Number(month.slice(5, 7)));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${month.slice(0, 4)}`;
};

export function MiniMonth({ month, busy, today }: { month: string; busy: Set<string>; today: string }) {
  return (
    <div>
      <div className={cal.mini}>
        {WEEK_LETTERS.map((l, i) => (
          <span key={i} className={cal.miniHead}>
            {l}
          </span>
        ))}
        {monthCells(month).map((d) =>
          d.startsWith(month) ? (
            <span
              key={d}
              className={cx(
                cal.miniDay,
                busy.has(d) && cal.miniBusy,
                isWeekend(d) && cal.miniWeekend,
                d === today && cal.miniToday,
              )}
            >
              {dayOfMonth(d)}
            </span>
          ) : (
            <span key={d} />
          ),
        )}
      </div>
    </div>
  );
}

export function MonthGrid({
  month,
  blocks,
  events,
  selectedId,
}: {
  month: string;
  blocks: CalendarBlock[];
  events: CalendarDayEvent[];
  selectedId?: number;
}) {
  const selectedDate = blocks.find((b) => b.id === selectedId)?.date;

  return (
    <div className={cal.month}>
      {WEEK_NAMES.map((n) => (
        <div key={n} className={cal.monthHead}>
          {n}
        </div>
      ))}
      {monthCells(month).map((d) => {
        const inMonth = d.startsWith(month);
        return (
          <div key={d} className={cx(cal.monthCell, !inMonth && cal.monthOut, d === selectedDate && cal.monthSelected)}>
            <span className={cal.monthDay}>{dayOfMonth(d)}</span>
            {inMonth &&
              events
                .filter((e) => e.date === d)
                .map((e) => (
                  <span key={e.title} className={cal.monthEvent} title={e.title}>
                    {e.title}
                  </span>
                ))}
            {inMonth &&
              blocks
                .filter((b) => b.date === d)
                .map((b) => (
                  <Link
                    key={b.id}
                    href={b.href ?? "#"}
                    className={cx(cal.chip, cal[b.tone], b.id === selectedId && cal.chipSelected)}
                    title={`${timeRange(b.start, b.end)} · ${b.title}`}
                  >
                    {b.assessment && <span aria-hidden="true">📝</span>}
                    {b.start.slice(0, 5).replace(/^0/, "")} · {b.title}
                  </Link>
                ))}
          </div>
        );
      })}
    </div>
  );
}
