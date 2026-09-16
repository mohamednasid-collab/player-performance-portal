import { expect,it } from 'vitest'
import { calculateBmi, bmiStatus, ageInYears } from '../src/lib/bmi'
const today=new Date(2026,8,16)
it('converts cm to metres for BMI',()=>expect(calculateBmi(180,75)).toBeCloseTo(23.148148))
it.each([[null,75],[180,null],[0,75],[-1,75],[180,0],[NaN,75],[180,Infinity]])('does not calculate missing or invalid values', (h,w)=>expect(calculateBmi(h,w)).toBeNull())
it.each([[18.49,'below'],[18.5,'normal'],[24.99,'normal'],[25,'above']])('classifies the unrounded adult BMI %s', (n,tone)=>expect(bmiStatus(Number(n),'1995-01-01',today).tone).toBe(tone))
it('uses birthday rather than calendar year to determine adulthood',()=>{expect(ageInYears('2006-09-17',today)).toBe(19);expect(bmiStatus(22,'2006-09-17',today).tone).toBe('neutral');expect(bmiStatus(22,'2006-09-16',today).tone).toBe('normal')})
it('does not classify youth or missing birth dates',()=>{expect(bmiStatus(30,'2012-01-01',today).tone).toBe('neutral');expect(bmiStatus(30,null,today).tone).toBe('neutral')})
