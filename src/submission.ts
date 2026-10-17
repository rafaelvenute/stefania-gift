import { formatDay, isFutureDay, shareText } from './dates.ts';
import type { Availability } from './dates.ts';
export async function submitAvailability(endpoint: string, data: Availability, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<void> {
  if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) throw new Error('Formspree is not configured');
  if (!data.dates.length || !data.dates.every(isFutureDay)) throw new Error('Choose future dates');
  const sorted = [...new Set(data.dates)].sort();
  const response = await fetcher(endpoint, {
    method: 'POST', signal, headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: "Stefania D'Amore", dates: sorted, date_labels: sorted.map(formatDay), time_preference: data.preference, message: data.message, availability_summary: shareText({ ...data, dates: sorted }), submitted_at: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, _subject: 'Stefania: le disponibilità per il teatro' }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.ok !== true) throw new Error('The service has not confirmed receipt');
}
