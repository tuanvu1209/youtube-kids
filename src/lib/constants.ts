export const AGE_GROUPS = [
  { value: "3-5", label: "3–5 tuổi", hint: "Mầm non" },
  { value: "6-8", label: "6–8 tuổi", hint: "Tiểu học" },
  { value: "9-12", label: "9–12 tuổi", hint: "Lớn hơn" },
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number]["value"];

export const AVATARS = ["🐻", "🦊", "🐼", "🦄", "🐣", "🐨", "🐯", "🐸", "🦁", "🐵"];

export const PLAYLIST_EMOJIS = [
  "🎨", "🎵", "🚀", "🦕", "📚", "🧪", "⚽", "🍳", "🌍", "🧸", "🎬", "🔤",
];

export function ageGroupLabel(value: string) {
  return AGE_GROUPS.find((g) => g.value === value)?.label ?? value;
}

export function formatDuration(seconds: number) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
