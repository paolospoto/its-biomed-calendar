import type { ExtractIssue } from "@/lib/extract";
import type { Tables } from "@/types/database.types";
import raw from "./data.json";

export type Course = Tables<"course">;
export type Module = Tables<"module">;
export type Teacher = Tables<"teacher">;
export type Lesson = Tables<"lesson">;
export type CalendarEvent = Tables<"calendar_event">;
export type ImportRow = Tables<"import_row">;
export type ModuleProgress = Tables<"module_progress">;
// Audit columns of import_batch only exist once a real import has run.
export type ImportBatch = Omit<Tables<"import_batch">, "created_at" | "created_by" | "applied_at">;
export type ImportReport = { lessons: number; events: number; computed_hours: number; hours_match: boolean };

type PreviewData = {
  reference: { date: string; time: string };
  course: Course;
  modules: Module[];
  teachers: Teacher[];
  lessons: Lesson[];
  calendar_events: CalendarEvent[];
  import_batches: ImportBatch[];
  import_rows: ImportRow[];
};

const data = raw as PreviewData;

export const reference = data.reference;
export const course = data.course;
export const modules = data.modules;
export const teachers = data.teachers;
export const lessons = data.lessons;
export const calendarEvents = data.calendar_events;
export const importBatches = data.import_batches;

const moduleMap = new Map(modules.map((m) => [m.id, m]));
const teacherMap = new Map(teachers.map((t) => [t.id, t]));
const batchMap = new Map(importBatches.map((b) => [b.id, b]));

export const getModule = (id: number | null) => (id == null ? undefined : moduleMap.get(id));
export const getTeacher = (id: number | null) => (id == null ? undefined : teacherMap.get(id));
export const getBatch = (id: number | null) => (id == null ? undefined : batchMap.get(id));
export const getLesson = (id: number) => lessons.find((l) => l.id === id);

export const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
export const durationHours = (start: string, end: string) => (timeToMinutes(end) - timeToMinutes(start)) / 60;

export const reportOf = (batch: ImportBatch) => batch.report as ImportReport;
export const issuesOf = (row: ImportRow) => row.issues as ExtractIssue[];

export const isDone = (l: Lesson) => l.lesson_date < reference.date;
const isUpcoming = (l: Lesson) =>
  l.lesson_date > reference.date || (l.lesson_date === reference.date && l.start_time >= reference.time);

export const upcomingLessons = (moduleId?: number) =>
  lessons.filter((l) => isUpcoming(l) && (moduleId == null || l.module_id === moduleId));

export const nextTest = (moduleId?: number) => upcomingLessons(moduleId).find((l) => l.assessment);

export const lessonsOfModule = (moduleId: number) => lessons.filter((l) => l.module_id === moduleId);

export const lessonsBetween = (from: string, to: string) =>
  lessons.filter((l) => l.lesson_date >= from && l.lesson_date <= to);

export const eventsBetween = (from: string, to: string) =>
  calendarEvents.filter((e) => e.event_date >= from && e.event_date <= to);

// Mirrors the module_progress view, with current_date fixed to the reference date.
export function moduleProgress(): ModuleProgress[] {
  return modules.map((m) => {
    const own = lessonsOfModule(m.id);
    const sum = (list: Lesson[]) => list.reduce((acc, l) => acc + (l.hours ?? 0), 0);
    return {
      module_id: m.id,
      course_id: m.course_id,
      name: m.name,
      area: m.area,
      planned_hours: m.planned_hours,
      scheduled_hours: sum(own),
      done_hours: sum(own.filter(isDone)),
      first_lesson: own[0]?.lesson_date ?? null,
      last_lesson: own.at(-1)?.lesson_date ?? null,
      final_test_date: own.find((l) => l.assessment === "final_test")?.lesson_date ?? null,
    };
  });
}

export const draftBatch = importBatches.find((b) => b.status === "draft")!;
export const draftRows = data.import_rows.filter((r) => r.batch_id === draftBatch.id);

export const manualEditsInPeriod = (batch: ImportBatch) =>
  lessonsBetween(batch.period_start, batch.period_end).filter((l) => l.edited_at);
