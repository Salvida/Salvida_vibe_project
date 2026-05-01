export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDateISO(date: Date): string {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

export function todayIso(): string {
  return formatDateISO(new Date());
}

export function formatDateShort(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [ys, ms, ds] = parts as [string, string, string];
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function cardState(
  value: unknown,
  submitAttempted: boolean,
): 'bc-empty' | 'bc-filled' | 'bc-error' {
  if (value) return 'bc-filled';
  if (submitAttempted) return 'bc-error';
  return 'bc-empty';
}
