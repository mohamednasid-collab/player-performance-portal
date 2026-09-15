import type { Assessment } from '../types'

const metrics = [
  ['technical', 'Technical'], ['physical','Physical'], ['tactical','Tactical'], ['attitude','Attitude']
] as const

export function TrendChart({ assessments }: { assessments: Assessment[] }) {
  const recent = [...assessments].slice(0,5).reverse()
  const width = 520, height = 220, padX = 42, padY = 28
  const xs = recent.map((_,i)=> padX + (i * ((width-padX*2)/Math.max(1,recent.length-1))))
  const y = (v:number|null) => height-padY-((Number(v ?? 0)/10)*(height-padY*2))
  const colors = ['#1769e8','#19a05a','#f57c14','#7d36df']
  return <div className="trend-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" aria-label="Performance trends">
      {[2,4,6,8,10].map(v=><g key={v}><line x1={padX} x2={width-padX} y1={y(v)} y2={y(v)} stroke="#e6ebf2"/><text x={8} y={y(v)+4} fontSize="11" fill="#6f7d91">{v}</text></g>)}
      {metrics.map(([key],mi)=>{
        const pts = recent.map((a,i)=>`${xs[i]},${y(a[key])}`).join(' ')
        return <g key={key}><polyline fill="none" stroke={colors[mi]} strokeWidth="2.2" points={pts}/>{recent.map((a,i)=><circle key={i} cx={xs[i]} cy={y(a[key])} r="4" fill={colors[mi]} stroke="white" strokeWidth="1.5"/>)}</g>
      })}
      {recent.map((a,i)=><text key={i} x={xs[i]-13} y={height-6} fontSize="11" fill="#6f7d91">{new Date(a.assessment_date).toLocaleDateString(undefined,{month:'short'})}</text>)}
    </svg>
    <div className="chart-legend">{metrics.map(([k,label],i)=><span key={k}><i style={{background:colors[i]}}/>{label}</span>)}</div>
  </div>
}
