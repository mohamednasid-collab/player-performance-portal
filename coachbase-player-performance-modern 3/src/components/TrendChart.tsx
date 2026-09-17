import type { Assessment } from '../types'
import { dailyTrends, metrics } from '../lib/ratings'
export function TrendChart({ assessments }: { assessments: Assessment[] }) {
  const recent = dailyTrends(assessments)
  if (!recent.length) return <p className="empty">No assessments yet.</p>
  const width = 620, height = 260, padX = 46, padY = 32
  const x = (i: number) => recent.length === 1 ? width / 2 : padX + i * (width - padX * 2) / (recent.length - 1)
  const y = (v: number) => height - padY - ((v - 1) / 4) * (height - padY * 2)
  const colors = ['#1769e8', '#f57c14', '#19a05a', '#c02670', '#7d36df']
  return <div className="trend-wrap"><p className="chart-caption">Daily average by category · 1–5 scale · latest eight dates</p><svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" role="img" aria-label="Daily performance averages on a scale from 1 to 5">
    {[1,2,3,4,5].map(v => <g key={v}><line x1={padX} x2={width-padX} y1={y(v)} y2={y(v)} stroke="#e6ebf2"/><text x={18} y={y(v)+4} fontSize="12">{v}</text></g>)}
    {metrics.map((key, mi) => <g key={key}>{recent.map((day, i) => {
      const value = day.values[mi], previous = i ? recent[i-1].values[mi] : null
      return value === null ? null : <g key={day.date}>{previous !== null && <line x1={x(i-1)} y1={y(previous)} x2={x(i)} y2={y(value)} stroke={colors[mi]} strokeWidth="2"/>}<circle cx={x(i)} cy={y(value)} r="4" fill={colors[mi]}><title>{day.date}: {key} {value.toFixed(2)} / 5</title></circle></g>
    })}</g>)}
    {recent.map((day,i) => <text key={day.date} x={x(i)} y={height-7} textAnchor="middle" fontSize="10">{day.date.slice(5)}</text>)}
  </svg><div className="chart-legend">{metrics.map((key,i) => <span key={key}><i style={{ background: colors[i] }}/>{key}</span>)}</div></div>
}
