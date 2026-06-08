/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object (local time, noon to avoid DST issues)
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
}

/**
 * Format a YYYY-MM-DD string to DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Add N days to a date string (YYYY-MM-DD) and return a new date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Get all days in range [startStr, endStr] inclusive as YYYY-MM-DD strings
 */
export function getDaysInRange(startStr: string, endStr: string): string[] {
  const days: string[] = [];
  let current = parseDate(startStr);
  const end = parseDate(endStr);
  while (current <= end) {
    days.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Get day of week: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

/**
 * Get abbreviated day name in Portuguese
 */
export function getDayName(dateStr: string): string {
  const dow = getDayOfWeek(dateStr);
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return names[dow] ?? '';
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(month: number): string {
  const names = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return names[month - 1] ?? '';
}

/**
 * Format YYYY-MM-DD as "Mês YYYY"
 */
export function formatMonthYear(dateStr: string): string {
  const [year, month] = dateStr.split('-').map(Number);
  return `${getMonthName(month ?? 1)} ${year}`;
}
