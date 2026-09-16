import type { Assessment } from '../types'
import rubric from '../data/assessment-rubric.json'
export { rubric }
export const metrics = ['technical', 'tactical', 'physical', 'mental', 'attitude'] as const
export type Category = typeof metrics[number]
export type AreaRatings = Record<Category, Record<string, number>>
export const ratingLabels = ['Very Low / Needs Significant Improvement', 'Below Average / Needs Improvement', 'Average / Meets Expected Level', 'Good / Above Expected Level', 'Excellent / Consistently High Level'] as const
export function emptyAreaRatings(): AreaRatings { return { technical: {}, tactical: {}, physical: {}, mental: {}, attitude: {} } }
export function validRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
}
export function validAverage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5
}
export function validateAreaRatings(value: unknown): asserts value is AreaRatings {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== metrics.length) throw new Error('Rate all 47 assessment areas before saving.')
  const record = value as Record<string, unknown>
  for (const category of metrics) {
    const group = record[category]
    if (!group || typeof group !== 'object' || Array.isArray(group) || Object.keys(group).length !== rubric[category].length) throw new Error(`Rate all ${rubric[category].length} ${category} areas before saving.`)
    for (const area of rubric[category]) if (!validRating((group as Record<string, unknown>)[area.id])) throw new Error(`${area.label} requires a whole-number rating from 1 to 5.`)
  }
}
export function mean(values: Array<number | null | undefined>): number | null {
  const present = values.filter(validAverage)
  return present.length ? present.reduce((sum, v) => sum + v, 0) / present.length : null
}
export function categoryAverage(ratings: AreaRatings, category: Category): number | null {
  return mean(rubric[category].map(area => ratings[category]?.[area.id]))
}
export function categoryRating(a: Assessment, category: Category): number | null {
  return a.area_ratings ? categoryAverage(a.area_ratings, category) : a[category]
}
export function averageAssessment(a: Assessment) { return mean(metrics.map(k => categoryRating(a,k))) }
export function overall(assessments: Assessment[]) { return mean(assessments.map(averageAssessment)) }
export function formatRating(value: number | null) { return value === null ? 'Not assessed' : `${value.toFixed(1)} / 5` }
export function ratingLabel(value: number | null) { return value === null ? 'Not assessed' : ratingLabels[Math.max(0, Math.min(4, Math.round(value) - 1))] }
export function dailyTrends(assessments: Assessment[]) {
  const dates = [...new Set(assessments.map(a => a.assessment_date))].sort().slice(-8)
  return dates.map(date => ({ date, values: metrics.map(k => mean(assessments.filter(a => a.assessment_date === date).map(a => categoryRating(a,k)))) }))
}
