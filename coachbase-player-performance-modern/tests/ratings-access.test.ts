import { describe, expect, it } from 'vitest'
import { averageAssessment, dailyTrends, formatRating, mean, validRating } from '../src/lib/ratings'
import { canEditTeam, canReadTeam, scopeData } from '../src/lib/access'
import type { Assessment, Profile, Team, PortalData } from '../src/types'
const manager={id:'manager',active:true,role:'manager'} as Profile
const a={id:'a',created_by:'manager'} as Team,b={id:'b',created_by:'coach'} as Team
const memberships=[{team_id:'b',user_id:'manager',role:'manager' as const}]
describe('ratings',()=>{
 it('allows only five integer choices',()=>{for(const n of [1,2,3,4,5])expect(validRating(n)).toBe(true);for(const n of [0,6,10,2.5,NaN,null,'3'])expect(validRating(n)).toBe(false)})
 it('distinguishes no data from a low score',()=>{expect(mean([null,null])).toBe(null);expect(formatRating(null)).toBe('Not assessed');expect(mean([1,null,5])).toBe(3)})
 it('averages on the original five point scale',()=>expect(averageAssessment({technical:1,tactical:2,physical:3,mental:4,attitude:5} as Assessment)).toBe(3))
 it('groups dates chronologically and includes mental without turning null into zero',()=>{const rows=[{assessment_date:'2026-09-02',mental:5},{assessment_date:'2026-09-01',mental:2},{assessment_date:'2026-09-01',mental:4}] as Assessment[];expect(dailyTrends(rows).map(x=>[x.date,x.values[3]])).toEqual([['2026-09-01',3],['2026-09-02',5]]);expect(dailyTrends(rows)[0].values[0]).toBe(null)})
})
describe('access',()=>{
 it('requires assignment even if a manager created another team',()=>{expect(canReadTeam(manager,a,memberships)).toBe(false);expect(canReadTeam(manager,b,memberships)).toBe(true)})
 it('does not let managers write even with a coach membership',()=>expect(canEditTeam(manager,b,[{team_id:'b',user_id:'manager',role:'coach'}])).toBe(false))
 it('allows administrators and assigned coaches to assess',()=>{expect(canEditTeam({...manager,role:'administrator'},a,[])).toBe(true);expect(canEditTeam({...manager,role:'coach'},b,[{team_id:'b',user_id:'manager',role:'coach'}])).toBe(true)})
 it('fails closed for inactive accounts',()=>expect(canReadTeam({...manager,active:false,role:'super_admin'},b,memberships)).toBe(false))
 it('filters every collection by team, including linked-user loopholes',()=>{const input={teams:[a,b],memberships,players:[{id:'pa',team_id:'a',linked_user_id:'manager'},{id:'pb',team_id:'b'}],sessions:[{id:'sa',team_id:'a'},{id:'sb',team_id:'b'}],assessments:[{id:'aa',team_id:'a',player_id:'pa'},{id:'ab',team_id:'b',player_id:'pb'},{id:'bad',team_id:'b',player_id:'pa'}]} as PortalData;const result=scopeData(manager,input);expect(result.teams.map(x=>x.id)).toEqual(['b']);expect(result.players.map(x=>x.id)).toEqual(['pb']);expect(result.sessions.map(x=>x.id)).toEqual(['sb']);expect(result.assessments.map(x=>x.id)).toEqual(['ab'])})
})

import { allRows } from '../src/lib/pagination'
describe('complete data loading',()=>{
 it('loads beyond the API row limit',async()=>{const source=Array.from({length:1201},(_,id)=>({id}));const rows=await allRows(async(from,to)=>({data:source.slice(from,to+1),error:null}));expect(rows).toEqual(source)})
 it('does not return partial results after a failed page',async()=>{await expect(allRows(async(from)=>from?{data:null,error:new Error('Load failed')}:{data:Array(500).fill(1),error:null})).rejects.toThrow('Load failed')})
})
