const asset = (path: string) => `${import.meta.env.BASE_URL}media/${path}`;
export const COPY = {
  studio: 'AMICI SENZA BUDGET PRODUCTIONS',
  slogan: 'Gli effetti speciali costavano troppo. Ci abbiamo messo il cuore.',
  welcome: 'LA TUA PRIMA STA PER COMINCIARE.',
  gift: 'STE, SI VA A TEATRO!',
  together: 'UNA SERATA TUTTI INSIEME.',
  givers: 'Rafael, Federica, Andrea e Davide',
  surprise: 'A sorpresa',
  final: 'ORA TOCCA ALLA PRODUZIONE FARE IL MIRACOLO.',
};
export type FilmSlot = { id: string; title: string; src: string | null; poster?: string; previewSeconds?: number };
// Each available film belongs in its own slot. null deliberately means a labelled preview.
export const MEDIA: { films: FilmSlot[]; continuous: string | null; chapterTime: number; finalFrame: string | null; envelopeMatch: { x: number; y: number; width: number; rotation: number } } = {
  films: [
    { id: 'studios', title: 'La grande produzione', src: asset('intro-studios-mobile.mp4'), poster: asset('intro-poster.webp') },
    { id: 'bollywood', title: 'La follia Bollywood', src: asset('bollywood-ticket-mobile.mp4'), poster: asset('bollywood-poster.webp') },
  ],
  // 1017.mp4 already contains both films. Prefer its continuous web rendition for gapless audio/video.
  // Set continuous to null to use the two replaceable film slots instead.
  continuous: asset('trailer-mobile.mp4'),
  chapterTime: 20.3,
  finalFrame: asset('envelope-final-frame.webp'),
  // Normalised coordinates of the envelope in the definitive 9:16 frame.
  envelopeMatch: { x: 0.482, y: 0.597, width: 0.843, rotation: 0 },
};
export const FORM_ENDPOINT = (import.meta.env.VITE_FORMSPREE_ENDPOINT || '').trim();
export const formConfigured = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(FORM_ENDPOINT);
export const STORAGE_KEY = 'stefania-availability-v1';
