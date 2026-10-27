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
const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,timeZoneId:'Europe/London'});
const m=await open('/website/',base,mobile);
await m.locator('#services').evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-110));
await snap(m,'mobile-services');
await m.getByRole('button',{name:'Book a visit',exact:true}).first().click();
await m.getByLabel('Vehicle registration',{exact:true}).fill('BT21 VGL');await m.getByLabel('Make & model',{exact:true}).fill('Volkswagen Golf');
await m.locator('.slot-picker').scrollIntoViewIfNeeded();await m.evaluate(()=>document.activeElement.blur());await snap(m,'mobile-calendar');
await m.locator('.slot-picker-times button').first().click();await m.getByRole('button',{name:'Continue',exact:true}).click();await m.getByLabel('Your name',{exact:true}).fill('Ben Carter');await m.getByLabel('Phone number',{exact:true}).fill('07700 900011');await m.getByLabel('Email address',{exact:true}).fill('ben.carter@example.com');await m.evaluate(()=>document.activeElement.blur());await snap(m,'mobile-details');
await browser.close();
