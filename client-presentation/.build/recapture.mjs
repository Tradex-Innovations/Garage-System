import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { seedWorkspace, addRequest } from '../../Prototype/lib/business.js';
import { STORAGE_KEY, DEMO_DATE, SAMPLE_CUSTOMERS } from '../../Prototype/lib/demo.js';
import { addDays, workshopDate, availableSlots, proposeBookingSlot } from '../../Prototype/lib/scheduling.js';
const root=path.resolve('client-presentation/.build/assets');
await fs.mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true});
const day=addDays(workshopDate(),1);
const base=seedWorkspace();
const calendar=seedWorkspace();
calendar.jobs=calendar.jobs.map(j=>({...j,date:day}));
const slot=availableSlots(calendar,day,'MOT test').find(s=>s.time==='12:00');
let pending=addRequest(calendar,{customer:SAMPLE_CUSTOMERS[1],type:'MOT booking',service:'MOT test',slot,bookingState:'Pending',preferredDate:day,preferredTime:slot.time,source:'Website',details:'MOT visit requested through the website calendar.',motPrep:'Yes',whatsappOptIn:true,messages:[]});
const calendarData=pending.workspace;
const proposed=proposeBookingSlot(calendarData,pending.requestId,day,'14:30').workspace;
let context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,timeZoneId:'Europe/London'});
async function prepare(page){await page.addStyleTag({content:'nextjs-portal{display:none!important} *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.dc-will-reveal{opacity:1!important;transform:none!important}'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.race([Promise.all(Array.from(document.images).filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r}))),new Promise(r=>setTimeout(r,1500))]);});}
async function open(url,data=base,ctx=context){const p=await ctx.newPage();await p.addInitScript(({key,data})=>localStorage.setItem(key,JSON.stringify({version:2,...data})),{key:STORAGE_KEY,data});await p.goto('http://127.0.0.1:3000'+url,{waitUntil:'networkidle'});await prepare(p);return p;}
async function snap(page,name,options={}){await page.screenshot({path:path.join(root,name+'.png'),...options});console.log(name);}
const prop=await open('/',proposed); await prop.getByRole('button',{name:/Ben Carter.*REQ-2008/}).click(); await prop.locator('.booking-decision').screenshot({path:path.join(root,'admin-proposal.png')}); await browser.close();
