import Link from "next/link";
import { hours1, numericDate } from "./format";
import m from "./maintenance.module.css";
import ui from "./ui.module.css";

export type MaintenanceTab = "import" | "edit" | "history" | "aliases";

const TABS: { key: MaintenanceTab; label: string }[] = [
  { key: "import", label: "Importa calendario" },
  { key: "edit", label: "Modifica calendario" },
  { key: "history", label: "Storico importazioni" },
  { key: "aliases", label: "Moduli, docenti e alias" },
];

export function MaintenanceHeader({
  subtitle,
  active,
  links,
}: {
  subtitle: string;
  active: MaintenanceTab;
  links: Partial<Record<MaintenanceTab, string>>;
}) {
  return (
    <>
      <header className={ui.pageHeader}>
        <div>
          <h1 className={ui.title}>Manutenzione</h1>
          <p className={ui.subtitle}>{subtitle}</p>
        </div>
        <span className={`${ui.badge} ${ui.badgeOk}`}>Accesso amministratore</span>
      </header>
      <nav className={m.tabs} aria-label="Sezioni manutenzione">
        {TABS.map((tab) => {
          const className = `${m.tab} ${tab.key === active ? m.tabActive : ""}`;
          const href = links[tab.key];
          return href ? (
            <Link
              key={tab.key}
              href={href}
              className={className}
              aria-current={tab.key === active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ) : (
            <span key={tab.key} className={`${className} ${m.tabDisabled}`} title="Schermata non presente nel mockup">
              {tab.label}
            </span>
          );
        })}
      </nav>
    </>
  );
}

export type Option = { value: number | string; label: string };

export type LessonFormValues = {
  moduleId: number | null;
  teacherId: number | null;
  date: string | null;
  assessment: string | null;
  start: string | null;
  end: string | null;
  note: string | null;
  hours: number | null;
};

export function LessonForm({
  values,
  modules,
  teachers,
  assessments,
  hint,
}: {
  values: LessonFormValues;
  modules: Option[];
  teachers: Option[];
  assessments: Option[];
  hint?: string;
}) {
  return (
    <>
      <div className={ui.field}>
        <label htmlFor="pv-module">Modulo {values.moduleId == null && <span className={m.required}>*</span>}</label>
        <select
          id="pv-module"
          className={`${ui.input} ${values.moduleId == null ? m.invalid : ""}`}
          defaultValue={values.moduleId ?? ""}
        >
          <option value="">Seleziona un modulo…</option>
          {modules.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className={ui.field}>
        <label htmlFor="pv-teacher">Docente (facoltativo)</label>
        <select id="pv-teacher" className={ui.input} defaultValue={values.teacherId ?? ""}>
          <option value="">Nessun docente</option>
          {teachers.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className={ui.fieldRow}>
        <div className={ui.field}>
          <label htmlFor="pv-date">Data</label>
          <input id="pv-date" className={ui.input} defaultValue={values.date ? numericDate(values.date) : ""} />
        </div>
        <div className={ui.field}>
          <label htmlFor="pv-assessment">Valutazione</label>
          <select id="pv-assessment" className={ui.input} defaultValue={values.assessment ?? ""}>
            <option value="">Nessuna</option>
            {assessments.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={ui.fieldRow}>
        <div className={ui.field}>
          <label htmlFor="pv-start">Inizio</label>
          <input id="pv-start" className={ui.input} defaultValue={values.start?.slice(0, 5) ?? ""} />
        </div>
        <div className={ui.field}>
          <label htmlFor="pv-end">Fine</label>
          <input id="pv-end" className={ui.input} defaultValue={values.end?.slice(0, 5) ?? ""} />
        </div>
      </div>
      <div className={ui.field}>
        <label htmlFor="pv-hours">Ore (calcolate)</label>
        <input id="pv-hours" className={ui.input} readOnly value={values.hours == null ? "" : hours1(values.hours)} />
        {hint && <span className={ui.hint}>{hint}</span>}
      </div>
      <div className={ui.field}>
        <label htmlFor="pv-note">Nota</label>
        <input id="pv-note" className={ui.input} placeholder="Facoltativa" defaultValue={values.note ?? ""} />
      </div>
    </>
  );
}

export function FormActions({
  deleteLabel,
  saveLabel,
  cancelHref,
}: {
  deleteLabel: string;
  saveLabel: string;
  cancelHref: string;
}) {
  return (
    <div className={m.actions}>
      <button type="button" className={`${ui.button} ${ui.buttonDanger}`}>
        {deleteLabel}
      </button>
      <Link href={cancelHref} className={ui.button}>
        Annulla
      </Link>
      <button type="button" className={`${ui.button} ${ui.buttonPrimary}`}>
        {saveLabel}
      </button>
    </div>
  );
}
