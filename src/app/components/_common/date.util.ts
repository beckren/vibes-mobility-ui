/**
 * Geteilte, zeitzonen-lokale Datums-Helfer für die App.
 * Kanonischer Ort für Datumsformatierung (statt pro Komponente reimplementiert).
 */

/** Lokaler `YYYY-MM-DD`-Schlüssel (kein UTC-Shift) – für Tages-Vergleiche/Gruppierung. */
export function toDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** ISO-Datumsanteil (`YYYY-MM-DD`) via UTC; leere Eingabe → `''`. Für Formular-/API-Werte. */
export function toIsoDateString(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Lokalisiertes Anzeigedatum (`toLocaleDateString`); ungültige Eingabe → Rohwert,
 * leere Eingabe → `fallback`. Für reine Anzeige in Tabellen/Historie.
 */
export function toLocaleDateOrRaw(value: string, fallback = ''): string {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

/**
 * Kombiniert ein Datum mit einer `HH:mm`-Zeit zu einem neuen `Date`.
 * Fehlt Datum oder Zeit, wird `null` zurückgegeben (matcht das bisherige
 * Guard-Verhalten der Check-in/Check-out/Exchange-Komponenten, die bei
 * fehlenden Werten nichts setzten). Für gebundene Datepicker+Timepicker-Paare.
 */
export function combineDateAndTime(
  date: Date | string | null | undefined,
  time: string | null | undefined
): Date | null {
  if (!date || !time) {
    return null;
  }
  const [hours, minutes] = time.split(':');
  const combined = new Date(date);
  combined.setHours(+hours, +minutes);
  return combined;
}

/**
 * Parst eine „flexible" Datumseingabe (`DDMMYYYY`, non-digits werden ignoriert)
 * zu einem lokalen `Date`; ungültige/kalendarisch unmögliche Werte → `null`.
 * Für die manuelle Schnelleingabe in den Check-in-Datumsfeldern.
 */
export function parseFlexibleDate(raw: string): Date | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (digits.length !== 8) {
    return null;
  }
  const dd = parseInt(digits.substring(0, 2), 10);
  const mm = parseInt(digits.substring(2, 4), 10) - 1;
  const yyyy = parseInt(digits.substring(4, 8), 10);

  const date = new Date(yyyy, mm, dd);
  return date.getDate() === dd && date.getMonth() === mm && date.getFullYear() === yyyy
    ? date
    : null;
}
