import Link from "next/link";
import { AppShell } from "@/components/calendar-ui/AppShell";
import {
  ASSESSMENT_LABEL,
  addDays,
  dayOfMonth,
  hours1,
  monthShort,
  numericDate,
  shortHash,
  shortModuleName,
  timeRange,
  weekdayDate,
  weekdayIndex,
} from "@/components/calendar-ui/format";
import { Icon } from "@/components/calendar-ui/icons";
import { FormActions, LessonForm, MaintenanceHeader } from "@/components/calendar-ui/maintenance";
import m from "@/components/calendar-ui/maintenance.module.css";
import ui from "@/components/calendar-ui/ui.module.css";
import {
  course,
  draftBatch,
  durationHours,
  draftRows,
  getModule,
  getTeacher,
  issuesOf,
  manualEditsInPeriod,
  reference,
  reportOf,
  type ImportRow,
} from "@/lib/preview/data";
import { admin, navLinks } from "../_view";
import { assessmentOptions, maintenanceTabs, moduleOptions, teacherOptions } from "./_options";

const BASE = "/anteprima/manutenzione";

function rowStatus(row: ImportRow) {
  const errors = issuesOf(row)
    .filter((i) => i.severity === "error")
    .map((i) => i.message);
  const warnings = issuesOf(row)
    .filter((i) => i.severity === "warning")
    .map((i) => i.message);
  if (row.kind === "lesson" && row.module_id == null) errors.push("Modulo sconosciuto");
  if (row.teacher_key && row.teacher_id == null) warnings.push("Docente sconosciuto");
  return { errors, warnings };
}

export default async function PreviewImportPage({
  searchParams,
}: {
  searchParams: Promise<{ riga?: string; tutte?: string }>;
}) {
  const { riga, tutte } = await searchParams;
  const batch = draftBatch;
  const report = reportOf(batch);
  const statuses = new Map(draftRows.map((r) => [r.id, rowStatus(r)]));
  const errorCount = [...statuses.values()].reduce((acc, s) => acc + s.errors.length, 0);
  const warningCount = [...statuses.values()].reduce((acc, s) => acc + s.warnings.length, 0);
  const manualEdits = manualEditsInPeriod(batch);

  const weekStart = addDays(reference.date, (8 - weekdayIndex(reference.date)) % 7 || 7);
  const weekEnd = addDays(weekStart, 4);
  const weekLabel = `Settimana ${dayOfMonth(weekStart)}–${dayOfMonth(weekEnd)} ${monthShort(weekEnd)}`;
  const showAll = tutte === "1";
  const rows = showAll
    ? draftRows
    : draftRows.filter((r) => r.row_date && r.row_date >= weekStart && r.row_date <= weekEnd);
  const selected = draftRows.find((r) => r.id === Number(riga));
  const query = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams(
      Object.entries({ tutte: showAll ? "1" : undefined, ...extra }).filter(
        (e): e is [string, string] => e[1] !== undefined,
      ),
    );
    return params.size ? `${BASE}?${params}` : BASE;
  };

  const unknownModules = [
    ...new Set(draftRows.filter((r) => r.kind === "lesson" && r.module_id == null).map((r) => r.module_key)),
  ];
  const unknownTeachers = [
    ...new Set(draftRows.filter((r) => r.teacher_key && r.teacher_id == null).map((r) => r.teacher_key)),
  ];

  return (
    <AppShell user={admin} active="maintenance" links={navLinks}>
      <MaintenanceHeader
        subtitle={`Importazione del calendario · ${course.code}`}
        active="import"
        links={maintenanceTabs}
      />

      <ol className={m.stepper}>
        <li className={m.step}>
          <span className={`${m.stepDot} ${m.stepDone}`}>
            <Icon name="check" size={14} />
          </span>
          Carica PDF
        </li>
        <li className={m.stepLine} aria-hidden="true" />
        <li className={`${m.step} ${m.stepActive}`}>
          <span className={`${m.stepDot} ${m.stepCurrent}`}>2</span>
          Revisione
        </li>
        <li className={m.stepLine} aria-hidden="true" />
        <li className={m.step}>
          <span className={m.stepDot}>3</span>
          Applica
        </li>
      </ol>

      <section className={`${ui.card} ${m.batch}`}>
        <div className={m.batchInfo}>
          <p className={m.batchName}>
            <Icon name="file" /> {batch.file_name} <span className={ui.badge}>Bozza</span>
          </p>
          <p className={ui.muted} style={{ margin: 0 }}>
            Periodo {numericDate(batch.period_start)} – {numericDate(batch.period_end)} · SHA-256{" "}
            {shortHash(batch.sha256)}
          </p>
        </div>
        <div className={m.stats}>
          <span className={m.stat}>
            <strong>{report.lessons}</strong> lezioni
          </span>
          <span className={m.stat}>
            <strong>{report.events}</strong> eventi
          </span>
          <span className={`${m.stat} ${errorCount ? m.statErr : ""}`}>
            <strong>{errorCount}</strong> errori
          </span>
          <span className={`${m.stat} ${warningCount ? m.statWarn : ""}`}>
            <strong>{warningCount}</strong> avvisi
          </span>
          <span className={`${m.stat} ${report.hours_match ? m.statOk : m.statWarn}`}>
            <strong>{hours1(report.computed_hours)} h</strong>
            {report.hours_match ? "calcolate = dichiarate" : `dichiarate ${hours1(batch.declared_hours ?? 0)} h`}
          </span>
        </div>
        <div className={m.batchActions}>
          <button type="button" className={ui.button}>
            Scarta bozza
          </button>
          <button type="button" className={`${ui.button} ${ui.buttonPrimary}`} disabled={errorCount > 0}>
            Applica
          </button>
        </div>
      </section>

      <section className={`${ui.card} ${m.overwrite}`}>
        <div className={ui.cardHeader}>
          <h2 className={`${ui.cardTitle} ${m.overwriteTitle}`}>
            <Icon name="warning" /> Modifiche manuali che verranno sovrascritte
          </h2>
          <span className={`${ui.badge} ${ui.badgeWarn}`}>{manualEdits.length}</span>
        </div>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Lezione</th>
              <th>Ora a calendario (modificata a mano)</th>
              <th>Dopo l&apos;import (dal PDF)</th>
            </tr>
          </thead>
          <tbody>
            {manualEdits.length === 0 && (
              <tr>
                <td colSpan={4} className={ui.empty}>
                  Nessuna lezione di questo periodo è stata modificata a mano: l&apos;import non sovrascrive nulla.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <label className={m.confirm}>
          <input type="checkbox" disabled={manualEdits.length === 0} /> Ho letto: nel mese vince il PDF e queste
          modifiche andranno perse.
        </label>
      </section>

      <div className={m.split}>
        <section className={ui.card}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>Righe estratte</h2>
            <span className={ui.muted} style={{ fontSize: 14 }}>
              {showAll ? `Tutte le ${draftRows.length} righe` : weekLabel} ·{" "}
              <Link href={showAll ? BASE : `${BASE}?tutte=1`} className={ui.link}>
                {showAll ? weekLabel : `Tutte le ${draftRows.length} righe`}
              </Link>
            </span>
          </div>
          <div className={m.tableWrap}>
            <table className={`${ui.table} ${m.rowsTable}`}>
              <thead>
                <tr>
                  <th>Pag.</th>
                  <th>Data e orario</th>
                  <th>Modulo</th>
                  <th>Docente</th>
                  <th>Ore</th>
                  <th>Valutaz.</th>
                  <th>Esito</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const status = statuses.get(r.id)!;
                  const mod = getModule(r.module_id);
                  const teacher = getTeacher(r.teacher_id);
                  const rowClass =
                    r.id === selected?.id
                      ? m.rowSelected
                      : status.errors.length
                        ? m.rowError
                        : status.warnings.length
                          ? m.rowWarning
                          : "";
                  return (
                    <tr key={r.id} className={rowClass}>
                      <td>p{r.page}</td>
                      <td className={m.nowrap}>
                        <Link href={query({ riga: String(r.id) })} className={m.cellStrong}>
                          {r.row_date ? weekdayDate(r.row_date) : "—"}
                        </Link>
                        <span className={m.time}>
                          {r.start_time && r.end_time ? timeRange(r.start_time, r.end_time) : "—"}
                        </span>
                      </td>
                      <td className={m.colModule}>
                        {r.kind === "event" ? (
                          r.title
                        ) : mod ? (
                          shortModuleName(mod.name)
                        ) : (
                          <span className={m.unlinked}>— non collegato</span>
                        )}
                        <span className={m.raw} title={r.raw_module ?? undefined}>
                          {r.raw_module}
                        </span>
                      </td>
                      <td className={m.colTeacher}>
                        {teacher?.full_name ??
                          (r.teacher_key ? <span className={m.unlinked}>— non collegato</span> : "—")}
                        <span className={m.raw} title={r.raw_teacher ?? undefined}>
                          {r.raw_teacher}
                        </span>
                      </td>
                      <td>{r.start_time && r.end_time ? hours1(durationHours(r.start_time, r.end_time)) : "—"}</td>
                      <td>
                        {r.assessment && (
                          <span className={`${ui.badge} ${ui.badgeWarn}`}>{ASSESSMENT_LABEL[r.assessment]}</span>
                        )}
                      </td>
                      <td>
                        {status.errors.map((e) => (
                          <span key={e} className={`${ui.badge} ${ui.badgeErr}`}>
                            {e}
                          </span>
                        ))}
                        {status.warnings.map((w) => (
                          <span key={w} className={`${ui.badge} ${ui.badgeWarn}`}>
                            {w}
                          </span>
                        ))}
                        {!status.errors.length && !status.warnings.length && (
                          <span className={`${ui.badge} ${ui.badgeOk}`}>OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={m.rowsFooter}>
            Per applicare servono: errori risolti e conferma della sovrascrittura. Gli avvisi non bloccano: una lezione
            senza docente viene salvata con docente vuoto.
          </p>
        </section>

        <aside className={`${ui.card} ${m.panel}`}>
          {selected ? (
            <RowEditor row={selected} errors={statuses.get(selected.id)!.errors.length} cancelHref={query({})} />
          ) : (
            <LinkUnknown modules={unknownModules} teachers={unknownTeachers} />
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function RowEditor({ row, errors, cancelHref }: { row: ImportRow; errors: number; cancelHref: string }) {
  return (
    <>
      <div className={ui.cardHeader}>
        <h2 className={ui.cardTitle}>Modifica riga</h2>
        {errors > 0 ? (
          <span className={`${ui.badge} ${ui.badgeErr}`}>{errors === 1 ? "1 errore" : `${errors} errori`}</span>
        ) : (
          <span className={`${ui.badge} ${ui.badgeOk}`}>Nessun errore</span>
        )}
      </div>
      <span className={ui.hint}>Originale dal PDF · pag. {row.page}</span>
      <p className={m.original}>{[row.raw_module ?? row.title, row.raw_teacher].filter(Boolean).join(" · ")}</p>
      <div className={ui.field}>
        <span className={ui.fieldLabel}>Tipo di riga</span>
        <div className={ui.segmented}>
          <button type="button" className={`${ui.segment} ${row.kind === "lesson" ? ui.segmentActive : ""}`}>
            Lezione
          </button>
          <button type="button" className={`${ui.segment} ${row.kind === "event" ? ui.segmentActive : ""}`}>
            Evento
          </button>
        </div>
      </div>
      <LessonForm
        values={{
          moduleId: row.module_id,
          teacherId: row.teacher_id,
          date: row.row_date,
          assessment: row.assessment,
          start: row.start_time,
          end: row.end_time,
          note: row.note,
          hours: row.start_time && row.end_time ? durationHours(row.start_time, row.end_time) : null,
        }}
        modules={moduleOptions}
        teachers={teacherOptions}
        assessments={assessmentOptions}
      />
      <p className={ui.hint}>
        Il collegamento a modulo e docente viene salvato come alias quando applichi l&apos;import.
      </p>
      <FormActions deleteLabel="Elimina riga" saveLabel="Salva riga" cancelHref={cancelHref} />
    </>
  );
}

function LinkUnknown({ modules, teachers }: { modules: (string | null)[]; teachers: (string | null)[] }) {
  const total = modules.length + teachers.length;
  return (
    <>
      <div className={ui.cardHeader}>
        <h2 className={ui.cardTitle}>Collega nomi sconosciuti</h2>
        <span className={`${ui.badge} ${total ? ui.badgeErr : ui.badgeOk}`}>{total}</span>
      </div>
      {total === 0 ? (
        <p className={ui.muted}>Tutti i moduli e i docenti di questo file sono già collegati.</p>
      ) : (
        <>
          {modules.map((key) => (
            <div key={key} className={ui.field}>
              <span className={ui.fieldLabel}>Modulo · «{key}»</span>
              <select className={ui.input} defaultValue="">
                <option value="">Seleziona un modulo…</option>
                {moduleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {teachers.map((key) => (
            <div key={key} className={ui.field}>
              <span className={ui.fieldLabel}>Docente · «{key}»</span>
              <select className={ui.input} defaultValue="">
                <option value="">Seleziona un docente…</option>
                {teacherOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </>
      )}
      <p className={ui.hint}>
        Il collegamento viene salvato come alias: dal prossimo import il nome sarà riconosciuto da solo. Seleziona una
        riga per correggerla.
      </p>
      <button
        type="button"
        className={`${ui.button} ${ui.buttonPrimary}`}
        style={{ width: "100%" }}
        disabled={total === 0}
      >
        Collega
      </button>
    </>
  );
}
