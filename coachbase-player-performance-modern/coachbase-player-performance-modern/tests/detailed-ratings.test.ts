import { expect,it } from 'vitest'
import { rubric,metrics,emptyAreaRatings,validateAreaRatings,categoryAverage,categoryRating,averageAssessment,formatRating,dailyTrends } from '../src/lib/ratings'
import type { Assessment } from '../src/types'
function complete(value=4){const ratings=emptyAreaRatings();for(const category of metrics) for(const area of rubric[category]) ratings[category][area.id]=value;return ratings}
it('contains exactly the requested 47 areas and category counts',()=>expect(metrics.map(k=>rubric[k].length)).toEqual([10,11,8,8,10]))
it('calculates Technical 4.1 from ten areas without prematurely rounding',()=>{const ratings=complete();ratings.technical.ball_control=5;validateAreaRatings(ratings);expect(categoryAverage(ratings,'technical')).toBe(4.1);expect(formatRating(categoryAverage(ratings,'technical'))).toBe('4.1 / 5')})
it('weights each of the five categories equally for overall performance',()=>{const ratings=complete(1);for(const a of rubric.technical) ratings.technical[a.id]=5;expect(averageAssessment({area_ratings:ratings} as Assessment)).toBe(1.8)})
it('keeps old category-only assessments without inventing area values',()=>{const old={technical:4,tactical:3,physical:5,mental:2,attitude:4,area_ratings:null} as Assessment;expect(categoryRating(old,'technical')).toBe(4);expect(averageAssessment(old)).toBe(3.6)})
it.each([0,6,2.5,NaN])('rejects an invalid individual score %s',value=>{const ratings=complete();ratings.technical.passing=value;expect(()=>validateAreaRatings(ratings)).toThrow()})
it('requires all areas without guessing defaults',()=>{const ratings=complete();delete ratings.mental.confidence;expect(()=>validateAreaRatings(ratings)).toThrow()})
it('rejects extra or unknown area keys',()=>{const ratings=complete();ratings.mental.unknown=4;expect(()=>validateAreaRatings(ratings)).toThrow()})
it('uses detailed averages in trends rather than a stale cached category field',()=>{const ratings=complete();ratings.technical.passing=5;const list=[{assessment_date:'2026-09-16',technical:1,area_ratings:ratings}] as Assessment[];expect(dailyTrends(list)[0].values[0]).toBe(4.1)})
