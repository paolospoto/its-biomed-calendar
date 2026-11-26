import Link from "next/link";
import { AppShell } from "@/components/calendar-ui/AppShell";
import { MonthGrid, monthTitle } from "@/components/calendar-ui/calendars";
import { hours1, longDate, monthName } from "@/components/calendar-ui/format";
import { Icon } from "@/components/calendar-ui/icons";
import { FormActions, LessonForm, MaintenanceHeader } from "@/components/calendar-ui/maintenance";
import m from "@/components/calendar-ui/maintenance.module.css";
import ui from "@/components/calendar-ui/ui.module.css";
import { calendarEvents, course, getBatch, getLesson, lessons, reference } from "@/lib/preview/data";
import { admin, navLinks, toBlock } from "../../_view";
import { assessmentOptions, maintenanceTabs, moduleOptions, teacherOptions } from "../_options";

const BASE = "/anteprima/manutenzione/calendario";

function shiftMonth(month: string, delta: number) {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

export default async function PreviewCalendarEditPage({
  searchParams,
}: {
  searchParams: Promise<{ mese?: string; lezione?: string }>;
}) {
  const { mese, lezione } = await searchParams;
  const selected = lezione ? getLesson(Number(lezione)) : undefined;
  const month =
    mese && /^\d{4}-\d{2}$/.test(mese) ? mese : (selected?.lesson_date.slice(0, 7) ?? reference.date.slice(0, 7));

  const monthLessons = lessons.filter((l) => l.lesson_date.startsWith(month));
  const monthEvents = calendarEvents.filter((e) => e.event_date.startsWith(month));
  const totalHours = monthLessons.reduce((acc, l) => acc + (l.hours ?? 0), 0);
  const [firstMonth, lastMonth] = [lessons[0].lesson_date.slice(0, 7), lessons.at(-1)!.lesson_date.slice(0, 7)];
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const batch = selected ? getBatch(selected.import_batch_id) : undefined;

  return (
    <AppShell user={admin} active="maintenance" links={navLinks}>
      <MaintenanceHeader
        subtitle={`Modifica diretta del calendario · ${course.code}`}
        active="edit"
        links={maintenanceTabs}
      />

      <div className={m.split}>
        <section className={ui.card}>
          <div className={m.monthToolbar}>
            <MonthNav
              href={prev >= firstMonth ? `${BASE}?mese=${prev}` : undefined}
              icon="chevronLeft"
              label="Mese precedente"
            />
            <h2 className={m.monthTitle}>{monthTitle(month)}</h2>
            <MonthNav
              href={next <= lastMonth ? `${BASE}?mese=${next}` : undefined}
              icon="chevronRight"
              label="Mese successivo"
            />
            <span className={m.monthMeta}>
              {hours1(totalHours)} h · {monthLessons.length} lezioni
            </span>
            <button type="button" className={ui.button}>
              <Icon name="plus" size={16} /> Evento
            </button>
            <button type="button" className={`${ui.button} ${ui.buttonPrimary}`}>
              <Icon name="plus" size={16} /> Nuova lezione
            </button>
          </div>
          <MonthGrid
            month={month}
            blocks={monthLessons.map((l) => toBlock(l, `${BASE}?lezione=${l.id}`))}
            events={monthEvents.map((e) => ({ date: e.event_date, title: e.title }))}
            selectedId={selected?.id}
          />
          <p className={m.rowsFooter}>
            Clicca una lezione o un evento per modificarlo. Le modifiche sono immediate e visibili agli studenti.
          </p>
        </section>

        <div className={m.side}>
          <section className={`${ui.card} ${m.panel}`}>
            {selected ? (
              <>
                <div className={ui.cardHeader}>
                  <h2 className={ui.cardTitle}>Modifica lezione</h2>
                  {selected.edited_at ? (
                    <span className={`${ui.badge} ${ui.badgeWarn}`}>Modificata a mano</span>
                  ) : (
                    batch && <span className={`${ui.badge} ${ui.badgeNeutral}`}>Da {batch.file_name}</span>
                  )}
                </div>
                <p className={m.panelSub}>{longDate(selected.lesson_date)}</p>
                <LessonForm
                  values={{
                    moduleId: selected.module_id,
                    teacherId: selected.teacher_id,
                    date: selected.lesson_date,
                    assessment: selected.assessment,
                    start: selected.start_time,
                    end: selected.end_time,
                    note: selected.note,
                    hours: selected.hours,
                  }}
                  modules={moduleOptions}
                  teachers={teacherOptions}
                  assessments={assessmentOptions}
                  hint="Non può sovrapporsi ad altre lezioni del corso"
                />
                <FormActions
                  deleteLabel="Elimina lezione"
                  saveLabel="Salva modifica"
                  cancelHref={`${BASE}?mese=${month}`}
                />
              </>
            ) : (
              <>
                <h2 className={ui.cardTitle}>Modifica lezione</h2>
                <p className={ui.muted}>Seleziona una lezione nel calendario per modificarla.</p>
              </>
            )}
          </section>
          <p className={`${ui.note} ${ui.noteWarn}`}>
            <Icon name="warning" />
            <span>
              <strong>Attenzione:</strong> se reimporti il PDF di {monthName(Number(month.slice(5, 7)))}, vince il PDF:
              le modifiche fatte a mano su questo mese verranno sostituite. Prima di applicare l&apos;import vedrai
              l&apos;elenco delle modifiche che andranno perse.
            </span>
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function MonthNav({ href, icon, label }: { href?: string; icon: "chevronLeft" | "chevronRight"; label: string }) {
  return href ? (
    <Link href={href} className={m.monthNav} aria-label={label}>
      <Icon name={icon} size={18} />
    </Link>
  ) : (
    <span className={`${m.monthNav} ${m.monthNavDisabled}`} aria-hidden="true">
      <Icon name={icon} size={18} />
    </span>
  );
}
