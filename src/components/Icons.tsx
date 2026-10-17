export function Icon({ name, size = 20 }: { name: 'sound' | 'mute' | 'arrow' | 'play' | 'pause' | 'replay' | 'chevron' | 'copy' | 'share' | 'close' | 'check'; size?: number }) {
  const paths = {
    sound: <><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    mute: <><path d="M11 5 6 9H3v6h3l5 4zM17 9l5 6m0-6-5 6"/></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>, play: <path d="m8 5 11 7-11 7z"/>, pause: <path d="M8 5v14M16 5v14"/>,
    replay: <><path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/></>, chevron: <path d="m9 5 7 7-7 7"/>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>,
    share: <><path d="M12 16V2m-5 5 5-5 5 5M5 12H3v9h18v-9h-2"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>, check: <path d="m5 12 4 4L19 6"/>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
export function Star({ className = '' }: { className?: string }) { return <svg className={className} viewBox="0 0 32 32" aria-hidden="true"><path d="m16 0 4 12 12 4-12 4-4 12-4-12L0 16l12-4z" fill="currentColor"/></svg>; }
