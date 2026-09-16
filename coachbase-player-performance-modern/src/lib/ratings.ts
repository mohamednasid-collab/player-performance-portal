import type { Assessment } from '../types'

export const metrics = ['technical', 'tactical', 'physical', 'mental', 'attitude'] as const
export const ratingLabels = ['Very Low / Needs Improvement', 'Below Average', 'Average', 'Good', 'Excellent'] as const
export function validRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
}
export function mean(values: Array<number | null | undefined>): number | null {
  const present = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 5)
  return present.length ? present.reduce((sum, v) => sum + v, 0) / present.length : null
}
export function averageAssessment(a: Assessment) { return mean(metrics.map(k => a[k])) }
export function overall(assessments: Assessment[]) { return mean(assessments.map(averageAssessment)) }
export function formatRating(value: number | null) { return value === null ? 'Not assessed' : `${value.toFixed(1)} / 5` }
export function ratingLabel(value: number | null) { return value === null ? 'Not assessed' : ratingLabels[Math.max(0, Math.min(4, Math.round(value) - 1))] }
export function dailyTrends(assessments: Assessment[]) {
  const dates = [...new Set(assessments.map(a => a.assessment_date))].sort().slice(-8)
  return dates.map(date => ({ date, values: metrics.map(k => mean(assessments.filter(a => a.assessment_date === date).map(a => a[k]))) }))
}
