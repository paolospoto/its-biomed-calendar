import type { CalendarBlock } from "@/components/calendar-ui/calendars";
import type { ShellUser } from "@/components/calendar-ui/AppShell";
import { ASSESSMENT_LABEL, moduleTone, shortModuleName, surname } from "@/components/calendar-ui/format";
import { course, getModule, getTeacher, type Lesson } from "@/lib/preview/data";

export const courseLabel = `${course.code} · Ed. ${course.edition}`;
export const student: ShellUser = { role: "student", courseLabel };
export const admin: ShellUser = { role: "admin", courseLabel };

export const navLinks = {
  home: "/anteprima",
  modules: "/anteprima/moduli/31",
  maintenance: "/anteprima/manutenzione",
};

export const moduleTitle = (moduleId: number) => shortModuleName(getModule(moduleId)?.name ?? "");
export const teacherName = (teacherId: number | null) => getTeacher(teacherId)?.full_name;

export function toBlock(lesson: Lesson, href?: string): CalendarBlock {
  const teacher = teacherName(lesson.teacher_id);
  return {
    id: lesson.id,
    date: lesson.lesson_date,
    start: lesson.start_time,
    end: lesson.end_time,
    title: moduleTitle(lesson.module_id),
    teacher: teacher && surname(teacher),
    tone: moduleTone(lesson.module_id),
    assessment: lesson.assessment ? ASSESSMENT_LABEL[lesson.assessment] : undefined,
    href,
  };
}
