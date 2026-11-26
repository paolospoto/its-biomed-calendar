import type { Option } from "@/components/calendar-ui/maintenance";
import { ASSESSMENT_LABEL } from "@/components/calendar-ui/format";
import { modules, teachers } from "@/lib/preview/data";

export const moduleOptions: Option[] = modules.map((m) => ({ value: m.id, label: m.name }));
export const teacherOptions: Option[] = teachers.map((t) => ({ value: t.id, label: t.full_name }));
export const assessmentOptions: Option[] = Object.entries(ASSESSMENT_LABEL).map(([value, label]) => ({ value, label }));

export const maintenanceTabs = {
  import: "/anteprima/manutenzione",
  edit: "/anteprima/manutenzione/calendario",
};
