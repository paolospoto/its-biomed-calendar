import Link from "next/link";
import { AppShell } from "@/components/calendar-ui/AppShell";
import { MiniMonth, WeekCalendar, monthTitle } from "@/components/calendar-ui/calendars";
import {
  ASSESSMENT_LABEL,
  addDays,
  dayOfMonth,
  inDays,
  hours1,
  hoursInt,
  isWeekend,
  longDate,
  monthName,
  monthShort,
  percent,
  time,
  timeRange,
  weekdayDate,
} from "@/components/calendar-ui/format";
import { Icon } from "@/components/calendar-ui/icons";
import { ProgressRing } from "@/components/calendar-ui/ProgressRing";
import ui from "@/components/calendar-ui/ui.module.css";
import {
  course,
  eventsBetween,
  lessons,
  lessonsBetween,
  moduleProgress,
  nextTest,
  reference,
  upcomingLessons,
} from "@/lib/preview/data";
import { moduleTitle, navLinks, student, teacherName, toBlock } from "./_view";
import s from "./home.module.css";

function nextWeekdays(from: string, count: number) {
  const days: string[] = [];
  for (let d = from; days.length < count; d = addDays(d, 1)) if (!isWeekend(d)) days.push(d);
  return days;
}

export default function PreviewHomePage() {
  const today = reference.date;
  const days = nextWeekdays(today, 5);
  const [first, last] = [days[0], days.at(-1)!];
  const upcoming = upcomingLessons();
  const next = upcoming[0];
  const test = nextTest();

  const curriculum = moduleProgress().filter((m) => m.area !== "internship");
  const planned = curriculum.reduce((acc, m) => acc + (m.planned_hours ?? 0), 0);
  const done = curriculum.reduce((acc, m) => acc + (m.done_hours ?? 0), 0);
  const scheduled = curriculum.reduce((acc, m) => acc + (m.scheduled_hours ?? 0), 0);

  const month = today.slice(0, 7);
  const busy = new Set(lessons.filter((l) => l.lesson_date.startsWith(month)).map((l) => l.lesson_date));
  const rangeLabel =
    first.slice(0, 7) === last.slice(0, 7)
      ? `${dayOfMonth(first)} – ${dayOfMonth(last)} ${monthName(Number(last.slice(5, 7)))} ${last.slice(0, 4)}`
      : `${weekdayDate(first)} – ${weekdayDate(last)}`;

  return (
    <AppShell user={student} active="home" links={navLinks}>
      <header className={ui.pageHeader}>
        <div>
          <h1 className={ui.title}>Calendario lezioni</h1>
          <p className={ui.subtitle}>
            {longDate(today)} · {course.code} · Edizione {course.edition}
          </p>
        </div>
      </header>

      <section className={s.hero}>
        <div className={s.heroMain}>
          {next ? (
            <>
              <p className={s.eyebrow}>Prossima lezione · {longDate(next.lesson_date).replace(/ \d{4}$/, "")}</p>
              <h2 className={s.heroTitle}>{moduleTitle(next.module_id)}</h2>
              <p className={s.heroMeta}>
                {teacherName(next.teacher_id) ?? "Docente non indicato"} · {timeRange(next.start_time, next.end_time)} (
                {hours1(next.hours ?? 0)} ore)
              </p>
              <Link href={`/anteprima/moduli/${next.module_id}`} className={s.heroButton}>
                Apri il modulo <Icon name="arrowRight" size={16} />
              </Link>
            </>
          ) : (
            <h2 className={s.heroTitle}>Nessuna lezione a calendario</h2>
          )}
        </div>
        <div className={s.heroProgress}>
          <ProgressRing
            value={percent(done, planned)}
            color="#fff"
            track="rgba(255,255,255,.25)"
            textColor="#fff"
            stroke={12}
          />
          <div>
            <p className={s.eyebrow}>Completamento corso</p>
            <p className={s.heroHours}>
              {hoursInt(done)} / {hoursInt(planned)} ore
            </p>
            <p className={s.heroMeta}>Aula e laboratorio · {hoursInt(scheduled)} h a calendario</p>
          </div>
        </div>
      </section>

      <div className={s.layout}>
        <section className={`${ui.card} ${s.calendarCard}`}>
          <div className={s.calendarToolbar}>
            <span className={ui.button}>Oggi</span>
            <h2 className={s.range}>{rangeLabel}</h2>
            <div className={ui.segmented} role="group" aria-label="Vista">
              <button type="button" className={ui.segment}>
                Giorno
              </button>
              <button type="button" className={`${ui.segment} ${ui.segmentActive}`} aria-pressed="true">
                Prossimi giorni
              </button>
              <button type="button" className={ui.segment}>
                Mese
              </button>
            </div>
          </div>
          <WeekCalendar
            days={days}
            blocks={lessonsBetween(first, last).map((l) => toBlock(l, `/anteprima/moduli/${l.module_id}`))}
            events={eventsBetween(first, last).map((e) => ({ date: e.event_date, title: e.title }))}
            today={today}
            now={reference.time}
          />
        </section>

        <aside className={s.aside}>
          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h2 className={ui.cardTitle}>Prossime lezioni</h2>
              <span className={ui.link}>Tutte</span>
            </div>
            <ul className={s.upcoming}>
              {upcoming.slice(0, 3).map((l) => (
                <li key={l.id}>
                  <span className={s.dateTile}>
                    <strong>{dayOfMonth(l.lesson_date)}</strong>
                    {monthShort(l.lesson_date)}
                  </span>
                  <div>
                    <p className={s.upcomingTitle}>{moduleTitle(l.module_id)}</p>
                    <p className={ui.muted}>{teacherName(l.teacher_id) ?? "Docente non indicato"}</p>
                  </div>
                  <div className={s.upcomingTime}>
                    {time(l.start_time)}
                    <span>{hours1(l.hours ?? 0)} h</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={ui.card}>
            <h2 className={ui.cardTitle}>Prossimo test</h2>
            {test?.assessment ? (
              <div className={s.test}>
                <span className={`${ui.badge} ${ui.badgeWarn}`}>
                  {ASSESSMENT_LABEL[test.assessment]} · {inDays(today, test.lesson_date)}
                </span>
                <p className={s.testTitle}>{moduleTitle(test.module_id)}</p>
                <p className={ui.muted}>
                  {weekdayDate(test.lesson_date)} · {time(test.start_time)} – {time(test.end_time)} (
                  {hours1(test.hours ?? 0)} h)
                </p>
              </div>
            ) : (
              <p className={ui.muted}>Nessun test a calendario.</p>
            )}
          </section>

          <section className={ui.card}>
            <h2 className={ui.cardTitle} style={{ marginBottom: 16 }}>
              {monthTitle(month)}
            </h2>
            <MiniMonth month={month} busy={busy} today={today} />
            <p className={`${ui.hint} ${s.miniNote}`}>I giorni in grassetto hanno lezioni.</p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
