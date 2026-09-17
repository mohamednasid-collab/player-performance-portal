import { defineConfig } from '@playwright/test'
export default defineConfig({testDir:'./tests/browser',testMatch:'startup.spec.ts',workers:1,use:{baseURL:'http://127.0.0.1:4174',headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || undefined},webServer:{command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174',url:'http://127.0.0.1:4174',reuseExistingServer:false}})
