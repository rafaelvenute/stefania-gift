export type Availability = { dates: string[]; preference: string; message: string };
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDay = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const isFutureDay = (key: string) => /^\d{4}-\d{2}-\d{2}$/.test(key) && localDay(parseDay(key)) === key && key > localDay();
export const formatDay = (key: string) => new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseDay(key));
export function readAvailability(key: string): Availability {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    return {
      dates: Array.isArray(data.dates) ? [...new Set<string>(data.dates.filter((d: unknown): d is string => typeof d === 'string' && isFutureDay(d)))].sort() : [],
      preference: ['Pomeriggio', 'Sera', 'Indifferente'].includes(data.preference) ? data.preference : 'Indifferente',
      message: typeof data.message === 'string' ? data.message.slice(0, 1200) : '',
    };
  } catch { return { dates: [], preference: 'Indifferente', message: '' }; }
}
export function shareText(data: Availability) {
  return `AMICI SENZA BUDGET PRODUCTIONS\nLe disponibilità di Stefania D'Amore\n\n${[...data.dates].sort().map(d => `• ${formatDay(d)}`).join('\n')}\n\nOrario: ${data.preference}${data.message ? `\nMessaggio: ${data.message}` : ''}\n\nDate proposte, da confermare insieme. Ste, si va a teatro!`;
}
