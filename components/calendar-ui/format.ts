import type { Enums } from "@/types/database.types";

const WEEKDAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const MONTHS = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI"];

export const parseDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const toIso = (d: Date) => d.toISOString().slice(0, 10);

export function addDays(iso: string, days: number) {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export const daysBetween = (from: string, to: string) =>
  Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);

export function inDays(from: string, to: string) {
  const n = daysBetween(from, to);
  return n === 0 ? "oggi" : n === 1 ? "domani" : `tra ${n} giorni`;
}

export const weekdayIndex = (iso: string) => parseDate(iso).getUTCDay();
export const isWeekend = (iso: string) => [0, 6].includes(weekdayIndex(iso));
export const weekday = (iso: string) => WEEKDAYS[weekdayIndex(iso)];
export const weekdayShort = (iso: string) => weekday(iso).slice(0, 3);
export const monthName = (month: number) => MONTHS[month - 1];
export const monthShort = (iso: string) => monthName(Number(iso.slice(5, 7))).slice(0, 3);
export const dayOfMonth = (iso: string) => Number(iso.slice(8, 10));

export const longDate = (iso: string) =>
  `${weekday(iso)} ${dayOfMonth(iso)} ${monthName(Number(iso.slice(5, 7)))} ${iso.slice(0, 4)}`;
export const shortDate = (iso: string) => `${dayOfMonth(iso)} ${monthShort(iso)}`;
export const shortDateWithYear = (iso: string) => `${shortDate(iso)} ${iso.slice(0, 4)}`;
export const weekdayDate = (iso: string) => `${weekdayShort(iso)} ${shortDate(iso)}`;
export const numericDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export const time = (t: string) => t.slice(0, 5).replace(/^0/, "");
export const timeRange = (start: string, end: string) => `${time(start)}–${time(end)}`;

const decimal = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0, useGrouping: "always" });
export const hours1 = (n: number) => decimal.format(n);
export const hoursInt = (n: number) => integer.format(n);
export const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

export const semesters = (list: number[]) => list.map((s) => ROMAN[s] ?? s).join(" – ");

export const AREA_LABEL: Record<Enums<"module_area">, string> = {
  theory: "Teoria/aula",
  lab: "Laboratorio",
  internship: "Stage/tirocinio",
};

export const ASSESSMENT_LABEL: Record<Enums<"assessment_kind">, string> = {
  intermediate_test: "Test intermedio",
  final_test: "Test finale",
  postponed_test: "Test rinviato",
};

const FAMILY_PREFIX = /^(Elementi|Fondamenti|Complementi) di informatica( medica)?( I{1,2})?: /;
export function shortModuleName(name: string) {
  const short = name.replace(FAMILY_PREFIX, "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export const surname = (fullName: string) => fullName.split(" ")[0];

export const MODULE_TONES = ["slate", "rose", "plum", "green", "amber", "blue", "teal"] as const;
export type ModuleTone = (typeof MODULE_TONES)[number];
export const moduleTone = (moduleId: number): ModuleTone => MODULE_TONES[moduleId % MODULE_TONES.length];

export const shortHash = (sha: string) => `${sha.slice(0, 4)}…${sha.slice(-4)}`;
