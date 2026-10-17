import { Star } from './Icons';
export function Theater({ final = false }: { final?: boolean }) {
  return <div className={`theater-environment ${final ? 'celebrating' : ''}`} aria-hidden="true">
    <div className="theater-ceiling"><i/><Star/><i/></div>
    <div className="stage-arch arch-left"/><div className="stage-arch arch-right"/>
    <div className="stage-light light-left"/><div className="stage-light light-right"/><div className="stage-light light-center"/>
    <div className="stage-floor"/><div className="footlights">{Array.from({ length: 13 }, (_, i) => <i key={i}/>)}</div>
    <div className="curtain curtain-left"/><div className="curtain curtain-right"/>
  </div>;
}
