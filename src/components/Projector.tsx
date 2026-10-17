import geometry from '../../assets/projector/geometry.json';
import turn from '../../assets/projector/turn/geometry.json';
const base = `${import.meta.env.BASE_URL}media/projector/`;
export function Projector() {
  const [width, height] = geometry.size;
  return <div className="projector-object projector-realistic" aria-hidden="true">
    <div className="projector-aura"/><div className="projector-ground-shadow"/>
    <div className="projector-assembly" style={{ aspectRatio: `${width}/${height}` }}>
      <div className="projector-static">
      <img className="projector-body" src={`${base}body.webp`} alt="" width={width} height={height} fetchPriority="high"/>
      {geometry.wheels.map((wheel, i) => <div key={i} className="projector-wheel-plane" style={{ left: `${wheel.center[0] / width * 100}%`, top: `${wheel.center[1] / height * 100}%`, width: `${512 / width * 100}%`, transform: `translate(-50%,-50%) matrix(${wheel.matrix.join(',')},0,0)` }}>
        <img className="reel-spin" data-reel={i ? 'two' : 'one'} src={`${base}reel.webp`} width="512" height="512" alt=""/>
      </div>)}
      </div>
      <div className="projector-turn-sprite" style={{ backgroundImage: `url(${base}turn-atlas.webp)`, backgroundSize: `${turn.columns * 100}% ${turn.rows * 100}%` }}/>
      <img className="projector-turn-atlas" src={`${base}turn-atlas.webp`} alt="" decoding="async" fetchPriority="low"/>
      <span className="projector-power-switch" style={{ left: `${geometry.indicator[0] / width * 100}%`, top: `${geometry.indicator[1] / height * 100}%` }}><i className="projector-status-light"/></span>
      <span className="projector-light-core" style={{ left: `${geometry.lens[0] / width * 100}%`, top: `${geometry.lens[1] / height * 100}%` }}/>
      <span className="projector-lens-halo" style={{ left: `${geometry.lens[0] / width * 100}%`, top: `${geometry.lens[1] / height * 100}%` }}/>
    </div>
    <span className="object-caption"><span/>35 MM · EDIZIONE STEFANIA</span>
  </div>;
}
