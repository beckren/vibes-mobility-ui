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
