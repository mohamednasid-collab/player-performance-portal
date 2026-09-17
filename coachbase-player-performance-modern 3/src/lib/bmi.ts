export function calculateBmi(heightCm: number | null | undefined, weightKg: number | null | undefined): number | null {
  if (!heightCm || !weightKg || !Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) return null
  return weightKg / ((heightCm / 100) ** 2)
}
export function ageInYears(dateOfBirth: string | null | undefined, today = new Date()): number | null {
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null
  const birth = new Date(`${dateOfBirth}T00:00:00`)
  if (!Number.isFinite(birth.getTime()) || birth > today) return null
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}
export function bmiStatus(bmi: number | null, dateOfBirth: string | null | undefined, today = new Date()) {
  if (bmi === null) return { tone: 'neutral', label: 'Enter height and weight to calculate BMI.' }
  const age = ageInYears(dateOfBirth, today)
  if (age === null) return { tone: 'neutral', label: 'Add date of birth to interpret BMI.' }
  if (age < 20) return { tone: 'neutral', label: 'Under 20: BMI category requires age- and sex-specific growth ranges.' }
  if (bmi < 18.5) return { tone: 'below', label: 'Below normal range' }
  if (bmi < 25) return { tone: 'normal', label: 'Normal range' }
  return { tone: 'above', label: 'Above normal range' }
}
