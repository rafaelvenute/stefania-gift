import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { gsap } from 'gsap';
import { FORM_ENDPOINT, formConfigured } from '../config';
import { formatDay, isFutureDay, localDay, parseDay, shareText } from '../dates';
import type { Availability } from '../dates';
import { audio } from '../audio';
import { submitAvailability } from '../submission';
import { Icon, Star } from './Icons';
export type Completion = 'received' | 'copied' | 'whatsapp' | 'shared' | 'prepared';
type Props = { data: Availability; setData: (data: Availability) => void; onComplete: (kind: Completion) => void; reduced: boolean; storageWarning: boolean };
const week = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const weekdays = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'];
export function AvailabilityCalendar({ data, setData, onComplete, reduced, storageWarning }: Props) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [copyFallback, setCopyFallback] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), root = useRef<HTMLDivElement>(null), focusedKey = useRef<string | null>(null), abort = useRef<AbortController | null>(null);
  const sorted = [...data.dates].sort(), firstOffset = (month.getDay() + 6) % 7, daysCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstOffset + daysCount) / 7) * 7 }, (_, i) => { const d = i - firstOffset + 1; return d > 0 && d <= daysCount ? new Date(month.getFullYear(), month.getMonth(), d, 12) : null; });
  const today = new Date(), canGoBack = month.getFullYear() * 12 + month.getMonth() > today.getFullYear() * 12 + today.getMonth();
  const monthLabel = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(month);
  useEffect(() => {
    if (confirm || copyFallback) dialog.current?.showModal(); else dialog.current?.close();
  }, [confirm, copyFallback]);
  useEffect(() => () => { abort.current?.abort(); }, []);
  useEffect(() => { if (focusedKey.current) root.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedKey.current}"]`)?.focus(); }, [month]);
  function toggle(key: string, target: HTMLButtonElement) {
    if (!isFutureDay(key)) return;
    const exists = data.dates.includes(key);
    setData({ ...data, dates: exists ? data.dates.filter(d => d !== key) : [...data.dates, key].sort() }); setError('');
    audio.click();
    if (!reduced) gsap.fromTo(target, { scale: .88 }, { scale: 1, duration: .22, ease: 'back.out(1.7)' });
  }
  function keyNavigate(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -((date.getDay() + 6) % 7), End: 6 - ((date.getDay() + 6) % 7) };
    if (!(event.key in offsets)) return;
    event.preventDefault(); const next = new Date(date); next.setDate(next.getDate() + offsets[event.key]);
    const key = localDay(next); if (!isFutureDay(key)) return;
    focusedKey.current = key;
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) setMonth(new Date(next.getFullYear(), next.getMonth(), 1, 12));
    else root.current?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus();
  }
  async function send() {
    if (!formConfigured || busy || !data.dates.length) return;
    if (!data.dates.every(isFutureDay)) { setError('Una data selezionata non è più futura. Aggiorna le disponibilità.'); setData({ ...data, dates: data.dates.filter(isFutureDay) }); setConfirm(false); return; }
    setBusy(true); setError(''); const controller = new AbortController(); abort.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      await submitAvailability(FORM_ENDPOINT, data, controller.signal);
      setConfirm(false); onComplete('received');
    } catch {
      setConfirm(false); setError('La produzione non ha ricevuto le date. Le tue selezioni sono ancora qui: riprova oppure usa copia o WhatsApp.');
    } finally { clearTimeout(timeout); setBusy(false); abort.current = null; }
  }
  async function copy() {
    if (!data.dates.length) return;
    try { await navigator.clipboard.writeText(shareText(data)); onComplete('copied'); }
    catch { setCopyFallback(true); }
  }
  async function share() {
    if (!data.dates.length) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'Ste, si va a teatro!', text: shareText(data) }); onComplete('shared'); }
      catch (e) { if ((e as Error).name !== 'AbortError') setError('La condivisione non è disponibile. Puoi copiare il messaggio o usare WhatsApp.'); }
    }
  }
  return <div ref={root} className="calendar-layout">
    <div className="calendar-story">
      <span className="eyebrow"><span className="short-rule"/> ATTO III · TUTTI IN SCENA</span>
      <h1 tabIndex={-1} className="scene-focus">Il vero colpo{' '}<br/>di scena?<br/><em>Riuscire a{' '}<br/>organizzarci.</em></h1>
      <p>Ste, ti portiamo a teatro. Lo spettacolo lo abbiamo già scelto noi: è una sorpresa! Ora troviamo una data in cui siamo tutti liberi.</p>
      <span className="story-note">Più date ci dai, più possibilità abbiamo di farcela.</span>
      <div className="story-ornament"><i/><Star/><i/></div>
    </div>
    <div className="calendar-program">
      <div className="program-heading"><Star/><span>IL PROGRAMMA DELLA SERATA</span><Star/></div>
      <h2>Quando sei libera?</h2><p className="calendar-instruction">SELEZIONA LE DATE IN CUI SEI LIBERA.</p>
      <div className="month-nav"><button className="icon-button previous-month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))} disabled={!canGoBack} aria-label="Mese precedente"><Icon name="chevron"/></button><h3 aria-live="polite">{monthLabel}</h3><button className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))} aria-label="Mese successivo"><Icon name="chevron"/></button></div>
      <table className="calendar-grid" aria-label={`Disponibilità di ${monthLabel}`}><thead><tr>{week.map((d, i) => <th scope="col" aria-label={weekdays[i]} key={i}>{d}</th>)}</tr></thead><tbody>{Array.from({ length: cells.length / 7 }, (_, row) => <tr key={row}>{cells.slice(row * 7, row * 7 + 7).map((d, i) => <td key={i}>{d ? <button type="button" data-date={localDay(d)} disabled={!isFutureDay(localDay(d))} aria-label={formatDay(localDay(d))} aria-pressed={data.dates.includes(localDay(d))} aria-current={localDay(d) === localDay() ? 'date' : undefined} onClick={e => toggle(localDay(d), e.currentTarget)} onKeyDown={e => keyNavigate(e, d)}>{d.getDate()}</button> : null}</td>)}</tr>)}</tbody></table>
      <div className="selection-summary" aria-live="polite"><span className="selection-dot"/><strong>{data.dates.length}</strong> {data.dates.length === 1 ? 'disponibilità selezionata' : 'disponibilità selezionate'}<span className="auto-saved">{storageWarning ? 'Solo questa sessione' : 'Salvate qui'}</span></div>
      {sorted.length ? <details className="selected-dates"><summary>Rivedi le date scelte <span>+</span></summary><ul>{sorted.map(key => <li key={key}><span>{formatDay(key)}</span><button type="button" aria-label={`Rimuovi ${formatDay(key)}`} onClick={() => setData({ ...data, dates: data.dates.filter(d => d !== key) })}><Icon name="close" size={14}/></button></li>)}</ul></details> : null}
      <fieldset className="time-preference"><legend>QUANDO TI È PIÙ COMODO?</legend><div>{['Pomeriggio', 'Sera', 'Indifferente'].map(time => <label key={time}><input type="radio" name="time" value={time} checked={data.preference === time} onChange={() => setData({ ...data, preference: time })}/><span>{time}</span></label>)}</div></fieldset>
      <label className="message-label" htmlFor="production-message">QUALCHE MESSAGGIO PER LA PRODUZIONE?</label><textarea id="production-message" rows={2} maxLength={1200} value={data.message} onChange={e => setData({ ...data, message: e.target.value })} placeholder="Tipo: dopo lo spettacolo ci scappa anche una pizza?"/>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button send-button" disabled={!formConfigured || !data.dates.length || busy} onClick={() => setConfirm(true)}>INVIA LE MIE DATE <Icon name="arrow"/></button>
      {!formConfigured ? <p className="service-note">L'invio automatico non è ancora attivo.<br/>Puoi mandare le date alla produzione con copia o WhatsApp.</p> : <p className="service-note">Rivedrai le date prima di confermare l'invio.</p>}
      <div className="manual-actions"><button disabled={!data.dates.length} onClick={copy}><Icon name="copy" size={16}/> Copia le disponibilità</button><a className={!data.dates.length ? 'disabled' : ''} href={data.dates.length ? `https://wa.me/?text=${encodeURIComponent(shareText(data))}` : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!data.dates.length} onClick={e => { if (!data.dates.length) e.preventDefault(); else onComplete('whatsapp'); }}><Icon name="share" size={16}/> WhatsApp</a></div>
      {typeof navigator.share === 'function' ? <button className="native-share" disabled={!data.dates.length} onClick={share}>Altre opzioni di condivisione</button> : null}
      <p className="booking-note">Disponibilità proposte. Nessuna prenotazione, per ora.</p>
    </div>
    <dialog ref={dialog} onCancel={e => { if (busy) e.preventDefault(); else { setConfirm(false); setCopyFallback(false); } }} aria-labelledby="confirm-title">
      <div className="confirm-content"><span className="eyebrow">ULTIMO CIAK</span><h2 id="confirm-title">{copyFallback ? 'Il messaggio è pronto.' : 'Confermi queste date?'}</h2>
        {copyFallback ? <><p>Il browser non consente la copia automatica. Seleziona il testo e copialo nella chat degli amici.</p><textarea className="copy-text" readOnly value={shareText(data)} onFocus={e => e.target.select()}/><button className="button" onClick={() => { setCopyFallback(false); onComplete('prepared'); }}>Vai al gran finale <Icon name="arrow"/></button></> : <><ul>{sorted.map(d => <li key={d}>{formatDay(d)}</li>)}</ul><p>Orario: <strong>{data.preference}</strong></p>{data.message ? <p className="review-message">{data.message}</p> : null}<button className="button" disabled={busy} onClick={send}>{busy ? 'Invio in corso…' : 'Conferma e invia'}<Icon name="arrow"/></button></>}
        <button className="text-button" disabled={busy} onClick={() => { setConfirm(false); setCopyFallback(false); }}>Torna alle mie date</button>
      </div>
    </dialog>
  </div>;
}
