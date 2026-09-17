import { bmiStatus, calculateBmi } from '../lib/bmi'
export function BmiDisplay({ heightCm, weightKg, dateOfBirth }: { heightCm?: number | null; weightKg?: number | null; dateOfBirth?: string | null }) {
  const bmi = calculateBmi(heightCm, weightKg), status = bmiStatus(bmi, dateOfBirth)
  return <div className={`bmi-display bmi-${status.tone}`} data-testid="bmi" aria-live="polite"><strong>BMI: {bmi === null ? '—' : bmi.toFixed(2)}</strong><span>{status.label}</span>{status.tone !== 'neutral' && <small>Adult reference: 18.5–under 25 · Screening measure, not a diagnosis.</small>}</div>
}
