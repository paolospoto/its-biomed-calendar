import { notFound } from "next/navigation";
import { AppShell } from "@/components/calendar-ui/AppShell";
import {
  AREA_LABEL,
  ASSESSMENT_LABEL,
  dayOfMonth,
  hours1,
  hoursInt,
  inDays,
  monthShort,
  percent,
  semesters,
  shortDate,
  shortDateWithYear,
  shortModuleName,
  time,
  timeRange,
  weekday,
} from "@/components/calendar-ui/format";
import { Icon } from "@/components/calendar-ui/icons";
import { ProgressRing } from "@/components/calendar-ui/ProgressRing";
import ui from "@/components/calendar-ui/ui.module.css";
import {
  getModule,
  isDone,
  lessonsOfModule,
  moduleProgress,
  nextTest,
  reference,
  upcomingLessons,
} from "@/lib/preview/data";
import { navLinks, student, teacherName } from "../../_view";
import s from "./module.module.css";

export default async function PreviewModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mod = getModule(Number(id));
  if (!mod) notFound();

  const progress = moduleProgress().find((p) => p.module_id === mod.id)!;
  const planned = progress.planned_hours ?? 0;
  const done = progress.done_hours ?? 0;
  const scheduled = progress.scheduled_hours ?? 0;
  const remaining = Math.max(planned - done, 0);
  const toPlan = Math.max(planned - scheduled, 0);

  const own = lessonsOfModule(mod.id);
  const teachers = [...new Set(own.map((l) => teacherName(l.teacher_id)).filter(Boolean))];
  const month = reference.date.slice(0, 7);
  const thisMonth = own.filter((l) => l.lesson_date.startsWith(month));
  const shown = thisMonth.length > 0 ? thisMonth : own.slice(-3);

  const test = nextTest(mod.id);
  const otherKind = test?.assessment === "intermediate_test" ? "final_test" : "intermediate_test";
  const other = upcomingLessons(mod.id).find((l) => l.assessment === otherKind);

  return (
    <AppShell user={student} active="modules" links={navLinks}>
      <nav className={s.breadcrumb} aria-label="Percorso">
        <span>Moduli</span> › <strong>{shortModuleName(mod.name)}</strong>
      </nav>
      <h1 className={`${ui.title} ${s.title}`}>{mod.name}</h1>
      <div className={s.tags}>
        <span className={ui.badge}>{AREA_LABEL[mod.area]}</span>
        {mod.semesters.length > 0 && (
          <span className={`${ui.badge} ${ui.badgeNeutral}`}>Semestri {semesters(mod.semesters)}</span>
        )}
        <span className={ui.muted}>
          {teachers.length > 1 ? "Docenti" : "Docente"}: {teachers.join(", ") || "non indicato"}
        </span>
      </div>

      <div className={s.grid}>
        <section className={`${ui.card} ${s.progressCard}`}>
          <ProgressRing
            value={percent(done, planned)}
            size={170}
            stroke={16}
            color="#98445c"
            track="#f5e6eb"
            textColor="#98445c"
          />
          <div className={s.progressBody}>
            <h2 className={ui.cardTitle}>Ore svolte sul totale previsto</h2>
            <p className={s.big}>
              {hoursInt(done)} <span>/ {hoursInt(planned)} ore</span>
            </p>
            <div className={s.bar}>
              <span className={s.barScheduled} style={{ width: `${Math.min(percent(scheduled, planned), 100)}%` }} />
              <span className={s.barDone} style={{ width: `${Math.min(percent(done, planned), 100)}%` }} />
            </div>
            <p className={s.legend}>
              <span className={s.dotDone} /> svolte {hoursInt(done)} h <span className={s.dotScheduled} /> a calendario{" "}
              {hoursInt(scheduled)} h
            </p>
            <p className={ui.muted}>
              {remaining === 0
                ? "Ore previste completate"
                : toPlan === 0
                  ? `Restano ${hoursInt(remaining)} h, tutte già pianificate`
                  : `Restano ${hoursInt(remaining)} h, di cui ${hoursInt(toPlan)} h non ancora a calendario`}
            </p>
          </div>
        </section>

        <section className={`${ui.card} ${s.testCard}`}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>Prossimo test</h2>
            {test?.assessment && (
              <span className={`${ui.badge} ${ui.badgeWarn}`}>
                {ASSESSMENT_LABEL[test.assessment].replace("Test ", "")}
              </span>
            )}
          </div>
          {test?.assessment ? (
            <>
              <div className={s.testRow}>
                <span className={s.testTile}>
                  <strong>{dayOfMonth(test.lesson_date)}</strong>
                  {monthShort(test.lesson_date)}
                </span>
                <div>
                  <p className={s.testName}>{ASSESSMENT_LABEL[test.assessment]}</p>
                  <p className={ui.muted}>
                    {weekday(test.lesson_date)} · {time(test.start_time)} – {time(test.end_time)} (
                    {hours1(test.hours ?? 0)} h)
                  </p>
                </div>
              </div>
              <p className={s.countdown}>{inDays(reference.date, test.lesson_date)}</p>
            </>
          ) : (
            <p className={ui.muted}>
              {progress.final_test_date
                ? `Test finale svolto il ${shortDateWithYear(progress.final_test_date)}.`
                : "Nessun test a calendario."}
            </p>
          )}
          <p className={s.otherTest}>
            {ASSESSMENT_LABEL[otherKind]}:{" "}
            <strong>
              {other ? `${weekday(other.lesson_date)} ${shortDate(other.lesson_date)}` : "nessuno a calendario"}
            </strong>
          </p>
        </section>

        <section className={ui.card}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>Lezioni del modulo</h2>
            <span className={ui.link}>Mostra tutte ({own.length})</span>
          </div>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Orario</th>
                <th>Docente</th>
                <th>Ore</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr key={l.id} className={l.assessment ? s.testLesson : undefined}>
                  <td>{shortDate(l.lesson_date)}</td>
                  <td>{timeRange(l.start_time, l.end_time)}</td>
                  <td>{teacherName(l.teacher_id) ?? "—"}</td>
                  <td>{hours1(l.hours ?? 0)}</td>
                  <td>
                    {l.assessment ? (
                      <span className={`${ui.badge} ${ui.badgeWarn}`}>📝 {ASSESSMENT_LABEL[l.assessment]}</span>
                    ) : isDone(l) ? (
                      <span className={`${ui.badge} ${ui.badgeOk}`}>Svolta</span>
                    ) : (
                      <span className={`${ui.badge} ${ui.badgeNeutral}`}>In programma</span>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className={ui.empty}>
                    Nessuna lezione a calendario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <div className={s.side}>
          <section className={ui.card}>
            <h2 className={ui.cardTitle}>Dettagli modulo</h2>
            <dl className={s.details}>
              <dt>Ambito</dt>
              <dd>{AREA_LABEL[mod.area]}</dd>
              <dt>Semestri</dt>
              <dd>{semesters(mod.semesters) || "—"}</dd>
              <dt>Ore previste</dt>
              <dd>{planned ? hoursInt(planned) : "—"}</dd>
              <dt>Ore a calendario</dt>
              <dd>{hoursInt(scheduled)}</dd>
              <dt>Prima lezione</dt>
              <dd>{progress.first_lesson ? shortDateWithYear(progress.first_lesson) : "—"}</dd>
            </dl>
          </section>
          <p className={ui.note}>
            <Icon name="info" />
            <span>
              Le ore svolte contano le lezioni fino a ieri. Il calendario viene caricato mese per mese: le ore non
              ancora a calendario compaiono quando viene importato il mese successivo.
            </span>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
