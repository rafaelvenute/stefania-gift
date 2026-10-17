export function ProjectionRig() {
  return <div className="projection-rig" aria-hidden="true">
    <svg className="projection-beams" viewBox="0 0 1100 1000" preserveAspectRatio="none">
      <defs>
        <radialGradient id="projection-forward-glow" gradientUnits="userSpaceOnUse"><stop stopColor="#fff9dd" stopOpacity=".84"/><stop offset=".18" stopColor="#ffe9b3" stopOpacity=".42"/><stop offset=".58" stopColor="#e2b867" stopOpacity=".13"/><stop offset="1" stopColor="#d6a64d" stopOpacity="0"/></radialGradient>
      </defs>
      <circle className="projection-forward-bloom" r="0" fill="url(#projection-forward-glow)"/>
      <circle className="projection-forward-ring" r="0" fill="none" stroke="#ffe9b9" strokeWidth=".8" strokeOpacity=".18"/>
    </svg>
  </div>;
}
