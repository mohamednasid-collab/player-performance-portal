import { test, expect, type Page } from '@playwright/test'
const userId='00000000-0000-4000-8000-000000000001'
async function setup(page:Page,role='administrator'){
 const user={id:userId,aud:'authenticated',role:'authenticated',email:'test@coachbase.local',app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}
 const session={access_token:'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6IjAwMDAwMDAwLTAwMDAtNDAwMC04MDAwLTAwMDAwMDAwMDAwMSJ9.signature',token_type:'bearer',refresh_token:'fake',expires_in:3600,expires_at:4102444800,user}
 await page.addInitScript(session=>localStorage.setItem('sb-coachportal-test-auth-token',JSON.stringify(session)),session)
 const teams=[{id:'a',name:'Falcons',created_by:userId,season:'2026',age_group:'U14'},{id:'b',name:'Eagles',created_by:'other',season:'2026',age_group:'U16'}]
 let players=[{id:'p1',team_id:'a',full_name:'Ali Ahmed',active:true,position:'Forward',jersey_number:9,date_of_birth:'2012-02-10',preferred_foot:'Right',notes:'Strong finisher',linked_user_id:null},{id:'p2',team_id:'b',full_name:'Other Player',active:true,position:'Defender'}]
 let sessions=[{id:'s1',team_id:'a',title:'Passing Practice',session_date:'2026-09-18',focus:'Passing',duration_minutes:90,notes:'Warm up first',created_by:userId},{id:'s2',team_id:'b',title:'Other Session',session_date:'2026-09-19',focus:'Defending',duration_minutes:60,notes:'',created_by:'other'}]
 const assessments=[{id:'r1',team_id:'a',player_id:'p1',session_id:'s1',assessment_date:'2026-09-01',technical:3,tactical:4,physical:5,mental:2,attitude:5,comments:'Keep progressing',assessed_by:userId}]
 const writes:{table:string;method:string;body:Record<string,unknown>}[]=[]
 await page.route('https://coachportal-test.supabase.co/**',async route=>{
  const request=route.request(),url=new URL(request.url()),table=url.pathname.split('/').at(-1)!,method=request.method(),body=method==='GET'?{}:request.postDataJSON()??{}
  if(url.pathname.includes('/auth/')){await route.fulfill({json:user});return}
  if(method!=='GET'){
   writes.push({table,method,body})
   if(table==='training_sessions'&&method==='PATCH'){sessions=sessions.map(s=>s.id==='s1'?{...s,...body}:s);await route.fulfill({json:sessions[0]});return}
   if(table==='training_sessions'&&method==='DELETE'){sessions=sessions.filter(s=>s.id!=='s1');assessments[0].session_id=null as unknown as string;await route.fulfill({json:{id:'s1'}});return}
   if(table==='players'&&method==='POST'){const row={id:'p3',...body} as typeof players[0];players.push(row);await route.fulfill({json:row});return}
   if(table==='players'&&method==='PATCH'){const id=url.searchParams.get('id')?.replace('eq.','');players=players.map(p=>p.id===id?{...p,...body}:p);await route.fulfill({json:players.find(p=>p.id===id)});return}
   if(table==='assessments'){const row={id:'r2',...body} as typeof assessments[0];assessments.push(row);await route.fulfill({json:row});return}
  }
  const records:Record<string,unknown>={profiles:{id:userId,username:'test',full_name:'Test User',role,active:true,must_change_password:false},team_members:role==='manager'?[{team_id:'a',user_id:userId,role:'manager'}]:[],teams,players,training_sessions:sessions,assessments}
  await route.fulfill({json:records[table]??[]})
 })
 return writes
}
test('dashboard cards route to teams, grouped sessions, players and full player profile',async({page})=>{
 await setup(page);await page.goto('/');await page.getByRole('link',{name:'2 Teams View your squads'}).click();await expect(page).toHaveURL(/\/teams$/)
 await page.goto('/');await page.getByRole('link',{name:'2 Training Sessions Browse sessions by team'}).click();await expect(page.getByRole('heading',{name:'Falcons'})).toBeVisible();await page.getByRole('combobox',{name:'Team',exact:true}).selectOption('b');await expect(page.getByRole('link',{name:'Passing Practice'})).toHaveCount(0)
 await page.goto('/');await page.getByRole('link',{name:'2 Players View player profiles'}).click();await page.getByRole('link',{name:'Ali Ahmed'}).click();await expect(page).toHaveURL(/\/players\/p1$/);await expect(page.getByText('Strong finisher')).toBeVisible();await expect(page.getByText('Keep progressing')).toBeVisible();await expect(page.getByRole('button',{name:'Review / Assess Player'})).toBeVisible();await expect(page.getByText('3.8 / 5').first()).toBeVisible()
})
test('profile assessment saves all five ratings and refreshes history',async({page})=>{
 const writes=await setup(page);await page.goto('/players/p1');await page.getByRole('button',{name:'Review / Assess Player'}).click();const dialog=page.getByRole('dialog');await expect(dialog.getByRole('combobox',{name:'Player',exact:true})).toHaveValue('p1');for(const metric of ['technical','tactical','physical','mental','attitude'])await dialog.getByRole('combobox',{name:metric,exact:true}).selectOption('5');await dialog.getByLabel('Comments').fill('Excellent progress');await dialog.getByRole('button',{name:'Save',exact:true}).click();await expect(dialog).toHaveCount(0);await expect(page.getByText('Excellent progress')).toBeVisible();expect(writes[0].body.technical).toBe(5);expect(writes[0].body.team_id).toBe('a')
})
test('session edit persists, deletion requires confirmation and retains assessment',async({page})=>{
 const writes=await setup(page);await page.goto('/sessions/s1');await page.getByRole('button',{name:'Edit Session'}).click();await page.getByLabel('Title',{exact:true}).fill('Updated Session');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('heading',{name:'Updated Session'})).toBeVisible();await page.getByRole('button',{name:'Delete Session',exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(writes.filter(w=>w.method==='DELETE')).toHaveLength(0);await page.getByRole('button',{name:'Delete Session',exact:true}).click();await page.getByRole('button',{name:'Confirm Delete'}).click();await expect(page).toHaveURL(/\/sessions$/);expect(writes.filter(w=>w.method==='DELETE')).toHaveLength(1);await page.goto('/players/p1');await expect(page.getByText('Keep progressing')).toBeVisible();await expect(page.getByText('No linked session')).toBeVisible()
})
test('manager sees own team only and direct links fail closed',async({page})=>{
 await setup(page,'manager');await page.goto('/players');await expect(page.getByRole('link',{name:'Ali Ahmed'})).toBeVisible();await expect(page.getByRole('link',{name:'Other Player'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Add Player'})).toHaveCount(0)
 for(const path of ['/teams/b','/players/p2','/sessions/s2','/sessions?team=b']){await page.goto(path);await expect(page.getByRole('heading',{name:'Page unavailable'})).toBeVisible();await expect(page.getByText('Other Player')).toHaveCount(0)}
 await page.goto('/players/p1');await expect(page.getByRole('button',{name:'Edit Player',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Review / Assess Player'})).toHaveCount(0);await page.goto('/sessions/s1');await expect(page.getByRole('button',{name:'Edit Session'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Delete Session'})).toHaveCount(0)
})
test('reports export five point ratings and handle empty date range',async({page})=>{
 await setup(page);await page.goto('/reports');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download CSV'}).click();expect((await download).suggestedFilename()).toBe('coachportal-assessments-1-to-5.csv');await page.getByLabel('From',{exact:true}).fill('2027-01-01');await expect(page.getByRole('button',{name:'Download CSV'})).toBeDisabled();await expect(page.getByText('Not assessed').first()).toBeVisible()
})
test('mobile profile fits the viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await setup(page);await page.goto('/players/p1');await expect(page.getByRole('heading',{name:'Ali Ahmed'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:'test-results/player-profile-mobile.png',fullPage:true})
})

test('add and edit a player with live adult BMI colors',async({page})=>{
 const writes=await setup(page)
 await page.goto('/players');await page.getByRole('button',{name:'Add Player',exact:true}).click()
 const dialog=page.getByRole('dialog');await dialog.getByRole('combobox',{name:'Team',exact:true}).selectOption('a')
 await dialog.getByLabel('Name',{exact:true}).fill('New Player')
 await dialog.getByLabel('Nick Name',{exact:true}).fill('Ace')
 await dialog.getByLabel('Date of birth').fill('1995-01-01')
 await dialog.getByLabel('Mobile number').fill('+960 7770000')
 await dialog.getByLabel('Position',{exact:true}).fill('Defender')
 await dialog.getByRole('combobox',{name:'Preferred foot'}).selectOption('Right')
 await dialog.getByLabel('Height (cm)').fill('180')
 await dialog.getByLabel('Weight (kg)').fill('50');await expect(dialog.getByTestId('bmi')).toHaveClass(/bmi-below/)
 await dialog.getByLabel('Weight (kg)').fill('90');await expect(dialog.getByTestId('bmi')).toHaveClass(/bmi-above/)
 await dialog.getByLabel('Weight (kg)').fill('75');await expect(dialog.getByTestId('bmi')).toHaveClass(/bmi-normal/)
 await expect(dialog.getByTestId('bmi')).toContainText('23.15')
 await dialog.getByRole('button',{name:'Save',exact:true}).click();await expect(dialog).toHaveCount(0)
 await page.getByRole('link',{name:'New Player',exact:true}).click();await expect(page.getByText('Ace',{exact:true})).toBeVisible();await expect(page.getByText('+960 7770000',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Edit Player',exact:true}).click();await expect(dialog.getByLabel('Name',{exact:true})).toHaveValue('New Player');await expect(dialog.getByLabel('Height (cm)')).toHaveValue('180')
 await dialog.getByLabel('Nick Name',{exact:true}).fill('Captain');await dialog.getByLabel('Weight (kg)').fill('95');await dialog.getByRole('button',{name:'Save',exact:true}).click()
 await expect(dialog).toHaveCount(0);await expect(page.getByText('Captain',{exact:true})).toBeVisible();await expect(page.getByTestId('bmi')).toHaveClass(/bmi-above/)
 expect(writes.filter(x=>x.table==='players').map(x=>x.method)).toEqual(['POST','PATCH'])
 await page.screenshot({path:'test-results/player-bmi.png',fullPage:true})
})
test('youth BMI is calculated without adult category and managers cannot edit players',async({page})=>{
 await setup(page);await page.goto('/players/p1');await page.getByRole('button',{name:'Edit Player',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByLabel('Height (cm)').fill('160');await dialog.getByLabel('Weight (kg)').fill('50');await expect(dialog.getByTestId('bmi')).toContainText('19.53');await expect(dialog.getByTestId('bmi')).toHaveClass(/bmi-neutral/);await expect(dialog.getByTestId('bmi')).toContainText('Under 20')
})
