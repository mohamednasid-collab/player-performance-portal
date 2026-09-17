import { categoryAverage, emptyAreaRatings, formatRating, mean, metrics, ratingLabels, rubric, type AreaRatings } from '../lib/ratings'
import type { Assessment } from '../types'
export function AssessmentAreaForm({ ratings, onChange }: { ratings: AreaRatings; onChange: (ratings: AreaRatings) => void }) {
  const completed = metrics.reduce((sum,k)=>sum+Object.keys(ratings[k]).length,0)
  return <div className="assessment-areas span-2"><p>Rate each observable area from 1–5. All 47 areas are required; category averages are calculated automatically.</p><p aria-live="polite"><strong>{completed} / 47 areas rated</strong></p>{metrics.map(category=><section key={category} className="assessment-category" aria-label={`${category} assessment areas`}><div className="category-heading"><h3 className="capitalize">{category}</h3><span data-testid={`average-${category}`}>{formatRating(categoryAverage(ratings,category))} · {Object.keys(ratings[category]).length}/{rubric[category].length} rated</span></div>{rubric[category].map(area=><div className="assessment-area" key={area.id}><div><label htmlFor={`${category}-${area.id}`}>{area.label}</label><p id={`${category}-${area.id}-help`}>{area.description}</p></div><select id={`${category}-${area.id}`} aria-label={area.label} aria-describedby={`${category}-${area.id}-help`} required value={ratings[category][area.id]??''} onChange={e=>onChange({...ratings,[category]:{...ratings[category],[area.id]:Number(e.target.value)}})}><option value="" disabled>Select rating</option>{ratingLabels.map((label,i)=><option value={i+1} key={label}>{i+1} — {label}</option>)}</select></div>)}</section>)}</div>
}
export function AssessmentBreakdown({ ratings }: { ratings: AreaRatings | null | undefined }) {
  if (!ratings) return <p className="empty">Earlier category-only assessment: individual areas were not recorded.</p>
  return <div className="assessment-breakdown">{metrics.map(category=><details key={category} className="assessment-category" open={category==='technical'}><summary><span className="capitalize">{category}</span> · {formatRating(categoryAverage(ratings,category))}</summary>{rubric[category].map(area=><div className="area-result" key={area.id}><div><strong>{area.label}</strong><small>{area.description}</small></div><span className={`rating ${ratings[category][area.id]>=4?'good':ratings[category][area.id]>=3?'mid':'low'}`}>{formatRating(ratings[category][area.id]??null)}</span></div>)}</details>)}</div>
}
export function PlayerAreaSummary({ assessments }: { assessments: Assessment[] }) {
  const detailed=assessments.filter(a=>a.area_ratings)
  if (!detailed.length) return <section className="panel padded"><h2>Assessment Areas</h2><p>No detailed assessments yet. Earlier category ratings are retained above.</p></section>
  const averages=emptyAreaRatings()
  for(const category of metrics) for(const area of rubric[category]) averages[category][area.id]=mean(detailed.map(a=>a.area_ratings?.[category][area.id]))!
  return <section className="panel padded"><h2>Assessment Area Averages</h2><p>Based on {detailed.length} detailed assessment{detailed.length===1?'':'s'}. Earlier category-only assessments are excluded from these area averages.</p><AssessmentBreakdown ratings={averages}/></section>
}
