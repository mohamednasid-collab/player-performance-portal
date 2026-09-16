import { test, expect } from '@playwright/test'
test('production startup displays login without environment variables or stored session',async({page})=>{
 const errors:string[]=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.goto('/')
 await expect(page.getByRole('heading',{name:'CoachPortal',exact:true})).toBeVisible()
 await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible()
 expect(errors).toEqual([])
 await page.screenshot({path:'test-results/production-login.png',fullPage:true})
})
