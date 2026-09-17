import { rubric,metrics,emptyAreaRatings } from '../src/lib/ratings'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest'
const db=new PGlite()
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`
const admin=id(1),coach=id(2),manager=id(3),playerUser=id(4),inactive=id(5),unassigned=id(6)
const teamA=id(10),teamB=id(11),playerA=id(20),playerB=id(21),sessionA=id(30),sessionB=id(31)
async function as(user:string){await db.exec(`reset role;select set_config('request.jwt.claim.sub','${user}',false);set role authenticated;`)}
beforeAll(async()=>{
 await db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'))
 await db.exec(`insert into auth.users values ${[admin,coach,manager,playerUser,inactive,unassigned].map(x=>`('${x}')`).join(',')};
 insert into profiles(id,username,full_name,role,active) values ('${admin}','admin','Admin','administrator',true),('${coach}','coach','Coach','coach',true),('${manager}','manager','Manager','manager',true),('${playerUser}','player','Player','player',true),('${inactive}','inactive','Inactive','manager',false),('${unassigned}','unassigned','Unassigned','manager',true);
 insert into teams(id,name,created_by) values('${teamA}','A','${coach}'),('${teamB}','B','${manager}');
 insert into team_members(team_id,user_id,role) values('${teamA}','${manager}','manager'),('${teamA}','${coach}','coach'),('${teamA}','${playerUser}','player'),('${teamA}','${inactive}','manager');
 insert into players(id,team_id,linked_user_id,full_name) values('${playerA}','${teamA}','${playerUser}','Player A'),('${playerB}','${teamB}','${manager}','Player B');
 insert into training_sessions(id,team_id,session_date,title,created_by) values('${sessionA}','${teamA}','2026-09-01','Session A','${coach}'),('${sessionB}','${teamB}','2026-09-01','Session B','${admin}');
 insert into assessments(id,team_id,player_id,session_id,assessment_date,technical,tactical,physical,mental,attitude,assessed_by) values('${id(40)}','${teamA}','${playerA}','${sessionA}','2026-09-01',0,2,5,7,10,'${coach}'),('${id(41)}','${teamB}','${playerB}','${sessionB}','2026-09-01',null,4,6,8,9,'${admin}');
 insert into development_plans(team_id,player_id,title,created_by) values('${teamA}','${playerA}','A','${coach}'),('${teamB}','${playerB}','B','${admin}');`)
 const sql=readFileSync(new URL('../supabase/migrations/20260916052019_team_access_five_point_ratings.sql',import.meta.url),'utf8')
 await db.exec(sql);await db.exec(sql)
 // Reproduce the reported PostgREST insert/select failure on the previous policy.
 await as(admin)
 await expect(db.query(`insert into players(team_id,full_name) values('${teamA}','Regression probe') returning *`)).rejects.toThrow(/row-level security/)
 await db.exec('reset role;')
 const upgrade=readFileSync(new URL('../supabase/migrations/20260916062343_player_details_and_insert_visibility.sql',import.meta.url),'utf8')
 await db.exec(upgrade);await db.exec(upgrade)
 const detailed=readFileSync(new URL('../supabase/migrations/20260916091633_detailed_player_assessments.sql',import.meta.url),'utf8')
 await db.exec(detailed);await db.exec(detailed)
})
beforeEach(async()=>{await db.exec('reset role;begin;')})
afterEach(async()=>{await db.exec('rollback;reset role;')})
afterAll(async()=>{await db.close()})
describe('migration and database authorization',()=>{
 it('converts once, retains nulls and preserves original scores privately',async()=>{const result=await db.query('select technical,tactical,physical,mental,attitude from assessments order by id');expect(result.rows).toEqual([{technical:'1',tactical:'1',physical:'3',mental:'4',attitude:'5'},{technical:null,tactical:'2',physical:'3',mental:'4',attitude:'5'}]);expect((await db.query('select count(*)::int as n from private.assessment_ratings_before_five_point')).rows).toEqual([{n:2}])})
 it('manager sees only assigned team across every data table',async()=>{await as(manager);for(const table of ['teams','players','training_sessions','assessments','development_plans'])expect((await db.query(`select * from ${table}`)).rows).toHaveLength(1);expect((await db.query(`select * from players where id='${playerB}'`)).rows).toHaveLength(0)})
 it('manager cannot create teams, players, sessions, or assessments',async()=>{await as(manager);await expect(db.exec(`insert into teams(name,created_by) values('Unauthorized','${manager}')`)).rejects.toThrow()})
 it('manager cannot add a player',async()=>{await as(manager);await expect(db.exec(`insert into players(team_id,full_name) values('${teamA}','Unauthorized')`)).rejects.toThrow()})
 it('manager cannot create assessments',async()=>{await as(manager);await expect(db.exec(`insert into assessments(team_id,player_id,assessment_date,technical,assessed_by) values('${teamA}','${playerA}','2026-09-02',4,'${manager}')`)).rejects.toThrow()})
 it('manager updates and deletes affect no rows',async()=>{await as(manager);expect((await db.query(`update training_sessions set title='Hacked' where id='${sessionA}' returning id`)).rows).toHaveLength(0);expect((await db.query(`delete from training_sessions where id='${sessionA}' returning id`)).rows).toHaveLength(0)})
 it('manager cannot assign themselves to another team',async()=>{await as(manager);await expect(db.exec(`insert into team_members values('${teamB}','${manager}','coach')`)).rejects.toThrow()})
 it('blocks self-promotion through profiles',async()=>{await as(manager);await expect(db.exec(`update profiles set role='administrator' where id='${manager}'`)).rejects.toThrow(/permission denied/)})
 it('blocks inactive accounts including memberships',async()=>{await as(inactive);expect((await db.query('select * from players')).rows).toHaveLength(0);expect((await db.query('select * from training_sessions')).rows).toHaveLength(0)})
 it('unassigned manager gets no team data',async()=>{await as(unassigned);expect((await db.query('select * from teams')).rows).toHaveLength(0)})
 it('admin sees all teams and can edit any session',async()=>{await as(admin);expect((await db.query('select * from teams')).rows).toHaveLength(2);expect((await db.query(`update training_sessions set title='Edited' where id='${sessionB}' returning title`)).rows).toEqual([{title:'Edited'}])})
 it('coach can assess their own player',async()=>{await as(coach);await db.exec(`insert into assessments(team_id,player_id,session_id,assessment_date,technical,tactical,physical,mental,attitude,assessed_by) values('${teamA}','${playerA}','${sessionA}','2026-09-02',1,2,3,4,5,'${coach}')`);expect((await db.query('select * from assessments')).rows).toHaveLength(2)})
 it('coach cannot write another team',async()=>{await as(coach);expect((await db.query(`update training_sessions set title='Denied' where id='${sessionB}' returning id`)).rows).toHaveLength(0)})
 it.each([0,6,2.5])('database rejects invalid rating %s',async(value)=>{await as(coach);await expect(db.exec(`update assessments set technical=${value} where id='${id(40)}'`)).rejects.toThrow(/check constraint/)})
 it('prevents mismatched player/team even for admin',async()=>{await as(admin);await expect(db.exec(`update assessments set player_id='${playerB}' where id='${id(40)}'`)).rejects.toThrow(/foreign key|row-level security/)})
 it('prevents mismatched session/team even for admin',async()=>{await as(admin);await expect(db.exec(`update assessments set session_id='${sessionB}' where id='${id(40)}'`)).rejects.toThrow(/foreign key|row-level security/)})
 it('deleting a session retains its assessments and nulls the link',async()=>{await as(coach);await db.exec(`delete from training_sessions where id='${sessionA}'`);expect((await db.query(`select session_id from assessments where id='${id(40)}'`)).rows).toEqual([{session_id:null}])})
 it('player sees only own player and assessment, even with teammates',async()=>{await db.exec(`insert into players(team_id,full_name) values('${teamA}','Teammate')`);await as(playerUser);expect((await db.query('select * from players')).rows).toHaveLength(1);expect((await db.query('select * from assessments')).rows).toHaveLength(1)})
 it('linked player retains own access without a membership',async()=>{await db.exec(`delete from team_members where user_id='${playerUser}'`);await as(playerUser);expect((await db.query('select * from players')).rows).toHaveLength(1);expect((await db.query('select * from teams')).rows).toHaveLength(1)})
 it('anonymous role cannot read data',async()=>{await db.exec('set role anon');await expect(db.exec('select * from players')).rejects.toThrow(/permission denied/)})
 it('authenticated users cannot read migration backups',async()=>{await as(admin);await expect(db.exec('select * from private.assessment_ratings_before_five_point')).rejects.toThrow(/permission denied/)})
})

describe('player insert and edit regression',()=>{
 it.each([admin,coach])('authorized role %s can insert and return a new player',async(user)=>{
  await as(user)
  const result=await db.query(`insert into players(team_id,full_name,nickname,mobile_number,height_cm,weight_kg) values('${teamA}','New Player','Ace','+960 7770000',180,75) returning full_name,nickname,height_cm,weight_kg`)
  expect(result.rows).toEqual([{full_name:'New Player',nickname:'Ace',height_cm:'180.00',weight_kg:'75.00'}])
 })
 it('coach can edit and return existing player details',async()=>{await as(coach);expect((await db.query(`update players set nickname='Updated',height_cm=175,weight_kg=70 where id='${playerA}' returning nickname,height_cm`)).rows).toEqual([{nickname:'Updated',height_cm:'175.00'}])})
 it('manager cannot edit an assigned player',async()=>{await as(manager);expect((await db.query(`update players set nickname='Denied' where id='${playerA}' returning id`)).rows).toHaveLength(0)})
 it('coach cannot insert players into other teams',async()=>{await as(coach);await expect(db.query(`insert into players(team_id,full_name) values('${teamB}','Denied') returning *`)).rejects.toThrow(/row-level security/)})
 it.each(['height_cm=0','height_cm=-5','height_cm=301','weight_kg=0','weight_kg=651'])('rejects invalid measurements: %s',async(assignment)=>{await as(admin);await expect(db.exec(`update players set ${assignment} where id='${playerA}'`)).rejects.toThrow(/check constraint/)})
})

function completeAreas(){const result=emptyAreaRatings();for(const k of metrics) for(const area of rubric[k]) result[k][area.id]=4;result.technical.ball_control=5;return result}
async function insertDetailed(ratings:unknown){return db.query(`insert into assessments(team_id,player_id,assessment_date,assessed_by,technical,area_ratings) values($1,$2,'2026-09-16',$3,1,$4::jsonb) returning technical,tactical,physical,mental,attitude,area_ratings`,[teamA,playerA,coach,JSON.stringify(ratings)])}
describe('detailed assessment storage',()=>{
 it('stores all areas and calculates category averages rather than trusting supplied averages',async()=>{await as(coach);const rows=(await insertDetailed(completeAreas())).rows as Record<string,unknown>[];expect(Number(rows[0].technical)).toBe(4.1);expect(Number(rows[0].tactical)).toBe(4);expect(rows[0].area_ratings).toEqual(completeAreas())})
 it.each([0,6,2.5,'4',null])('rejects invalid area score %s',async(value)=>{await as(coach);const ratings=completeAreas();(ratings.technical as Record<string,unknown>).passing=value;await expect(insertDetailed(ratings)).rejects.toThrow(/rating|whole number/)})
 it('rejects missing areas',async()=>{await as(coach);const ratings=completeAreas();delete ratings.attitude.effort;await expect(insertDetailed(ratings)).rejects.toThrow(/areas/)})
 it('rejects extra areas',async()=>{await as(coach);const ratings=completeAreas();ratings.physical.extra=5;await expect(insertDetailed(ratings)).rejects.toThrow(/areas/)})
 it('prevents managers submitting detailed assessments',async()=>{await as(manager);await expect(insertDetailed(completeAreas())).rejects.toThrow(/row-level security/)})
 it('retains earlier assessments as category-only',async()=>expect((await db.query(`select area_ratings from assessments where id='${id(40)}'`)).rows).toEqual([{area_ratings:null}]))
})
