import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { FileBlob, Presentation, PresentationFile } from '@oai/artifact-tool';
import { PDFDocument } from 'pdf-lib';
const WORK=path.resolve('client-presentation');
const TMP=path.join(WORK,'.build');
const ASSETS=path.join(TMP,'assets');
const OUT=path.join(WORK,'output');
const SKILL='/Users/sarindusamarasekara/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const RUNTIME='/Users/sarindusamarasekara/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(RUNTIME,'node/node_modules');
const { finalizePresentation }=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
await fs.mkdir(OUT,{recursive:true});
await fs.mkdir(path.join(TMP,'renders'),{recursive:true});
const C={navy:'#102936',blue:'#008DCB',cyan:'#43B8E5',ink:'#183542',muted:'#607785',light:'#F1F6F9',white:'#FFFFFF',pale:'#AEC4D1'};
const presentation=Presentation.create({slideSize:{width:1600,height:900}});
function tx(s,text,x,y,w,h,size=30,color=C.ink,bold=false){const shape=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});shape.text=text;shape.text.style={typeface:'Arial',fontSize:size,color,bold,verticalAlignment:'top',wrap:'square',autoFit:'none',insets:0};return shape;}
function slide(title,{dark=false,notes='',foot='Product prototype'}={}){const s=presentation.slides.add();s.background.fill=dark?C.navy:C.white;if(title)tx(s,title,64,58,1460,95,58,dark?C.white:C.ink,true);tx(s,foot,64,857,1100,22,17,dark?C.pale:C.muted);tx(s,String(presentation.slides.items.length).padStart(2,'0'),1490,857,46,23,18,dark?C.pale:C.muted);s.speakerNotes.text=notes;return s;}
async function image(s,file,x,y,w,h,{fit='contain',round=0,alt=file}={}){const p=file.startsWith('/')?file:path.join(ASSETS,file);const sourceBytes=await fs.readFile(p);const format=(await sharp(sourceBytes).metadata()).format;const bytes=format==='webp'?await sharp(sourceBytes).png().toBuffer():sourceBytes;s.images.add({blob:bytes,contentType:format==='jpeg'?'image/jpeg':'image/png',alt,position:{left:x,top:y,width:w,height:h},fit,...(round?{geometry:'roundRect',borderRadius:round}:{})});}
function point(s,heading,body,x,y,w=355,{dark=false}={}){tx(s,heading,x,y,w,45,29,dark?C.cyan:C.blue,true);tx(s,body,x,y+49,w,110,27,dark?C.pale:C.muted);}
const local='Screenshots: local DC Motors website and admin prototype, captured 26 October 2026. All customer records and prices are fictional demonstration data. Screens use prepared local demo states. ';
const sources='Website imagery uses stock concept photography from the local public/website/ASSETS.md manifest, not images of the client premises or completed projects. Source components: Prototype/app/website/CustomerWebsite.jsx, Prototype/app/page.jsx, Prototype/components/AdminFeatures.jsx, Prototype/lib/business.js and Prototype/lib/scheduling.js. ';
const disclaimer='This is a product prototype. Calendar and message workflows run locally in the browser. A production release needs a backend, authentication and configured service connections. No live WhatsApp messages or payments have been sent. ';

// 01
{
const s=slide('',{dark:true,foot:'Product introduction for DC Motors Ltd',notes:'Introduce the proposal as a connected customer website and workshop workspace. The deck shows the current prototype and the business workflow it is designed to support. '+disclaimer+'Cover image: Unsplash, https://images.unsplash.com/photo-1503376780353-7e6692767b70. Concept automotive photography, not a DC Motors vehicle or completed project.'});
await image(s,path.resolve('Prototype/public/website/hero.jpg'),640,0,960,900,{fit:'cover'});
await image(s,path.resolve('Prototype/public/dc-motors-logo.png'),64,62,300,100);
tx(s,'DC Motors\nDigital\nExperience',64,260,550,290,72,C.white,true);
tx(s,'Customer website +\nworkshop management',68,529,545,100,34,C.pale);
tx(s,'26 October 2026',68,753,400,32,22,C.pale);
}
// 02
{
const s=slide('Website and workshop, working together',{dark:true,notes:'Frame the product as a continuous business journey rather than two separate software demonstrations. Customers discover services and request visits. Staff review the request, agree a slot and carry the record through workshop work. Intended benefits are qualitative, not measured financial results. '+sources+disclaimer});
tx(s,'One customer enquiry can stay connected\nthrough the whole visit',64,193,1200,120,47,C.white,true);
const xs=[64,448,832,1216];const data=[['01','Discover','Clear services and\na direct enquiry path'],['02','Request','A calendar slot with\nvehicle details attached'],['03','Agree','Staff approval or\na suggested time'],['04','Manage','Workshop work and\ncustomer history']];
data.forEach(([n,h,b],i)=>{tx(s,n,xs[i],397,270,75,63,C.cyan,true);tx(s,h,xs[i],500,280,50,36,C.white,true);tx(s,b,xs[i],571,305,125,28,C.pale);});
}
// 03
{
const s=slide('A stronger first impression',{notes:local+'The redesigned homepage presents the DC Motors brand, vehicle care and customisation offering. Point out the clear service and quote actions. Brand animation and responsive motion can be demonstrated live, while this slide contains a still screenshot. Existing website imagery is stock concept photography and does not depict the client workshop. '+sources});
point(s,'Clear service routes','Customers can find the work they need and choose a relevant next step.',64,238,350);
point(s,'Direct actions','Booking, quote enquiries and contact options stay visible.',64,475,350);
await image(s,'website-desktop.png',451,171,1085,685,{round:9,alt:'Desktop view of the redesigned DC Motors homepage'});
}
// 04
{
const s=slide('Designed for customers on their phone',{notes:local+'These are real mobile viewport captures of the homepage, service categories and contact section. Explain the persistent call, WhatsApp and booking actions. The contact actions link to existing services. The deck makes no claim that every visitor uses mobile or that conversion has already increased. '+sources});
tx(s,'The key actions remain\nwithin easy reach',64,243,465,120,43,C.ink,true);
tx(s,'Explore the services.\nRequest a visit.\nContact the workshop.',64,412,425,155,29,C.muted);
for(const [i,f,label] of [[0,'mobile-home.png','Homepage'],[1,'mobile-services.png','Services'],[2,'mobile-contact.png','Contact']]){await image(s,f,586+i*321,190,275,595,{round:12});tx(s,label,586+i*321,805,275,32,23,C.muted);}
}
// 05
{
const s=slide('Services that are easy to explore',{notes:local+'The public experience covers MOT and preparation, servicing, mechanical repairs, wrapping, paint protection film and fleet branding. The selected screenshot shows the wrapping service page. Customers can request a consultation or submit a quote-only enquiry. Links to the existing used-car sales site, billing, maps, telephone and WhatsApp remain available. '+sources});
point(s,'Every service has a place','Dedicated pages explain the next step for routine care and custom work.',64,230,360);
point(s,'Connected services','Used cars, invoice payment and contact links retain their roles.',64,474,360);
await image(s,'website-wrapping-desktop.png',466,176,1070,640,{round:9});
}
// 06
{
const s=slide('Calendar booking on mobile',{notes:local+'The website calendar shows available times after accounting for workshop hours, visit duration, bay and technician capacity, and provisional requests. The customer selects a time and shares vehicle and contact information. The slot is a request until workshop approval. Quote categories can request a consultation without committing to a project price, or submit an enquiry without a visit. '+sources});
point(s,'Choose an available time','The calendar reflects the workshop’s scheduling rules.',64,231,530);
point(s,'Share the details once','The request carries the vehicle and contact information into admin.',64,445,530);
tx(s,'Staff confirm the appointment',64,685,530,78,31,C.blue,true);
await image(s,'mobile-calendar.png',782,185,285,617,{round:12});await image(s,'mobile-details.png',1179,185,285,617,{round:12});
tx(s,'Date & time',782,817,285,28,23,C.muted);tx(s,'Customer details',1179,817,285,28,23,C.muted);
}
// 07
{
const s=slide('A calendar that keeps staff in control',{notes:local+'The admin application opens to the diary. Pending requests, confirmed appointments and proposed times use distinct visual states. Staff can open a request to accept it, decline it or suggest another slot. Staff can also create and reschedule bookings. Opening hours and resources are prototype rules, not an integration with an external calendar. '+sources});
point(s,'One scheduling view','Customer requests appear beside work already booked.',64,231,350);
point(s,'Staff make the decision','Confirm, decline or agree another time before the visit.',64,466,350);
await image(s,'admin-calendar-refined.png',454,164,1082,674,{round:9});
}
// 08
{
const s=slide('Every enquiry has a clear next step',{notes:local+'The Requests inbox groups MOT, service, repair estimate, wrapping/PPF/branding and callback enquiries. Source and request status help staff understand what needs attention. Selecting a category filters the request list. The website feeds this local inbox; other channels can be recorded manually in the prototype. This is not a claim of live omnichannel ingestion. '+sources});
tx(s,'A clear route\nfor each enquiry',64,225,365,130,42,C.ink,true);
tx(s,'Each request retains the\ncustomer, vehicle, source\nand decision history.',64,428,365,150,28,C.muted);
await image(s,'admin-requests.png',454,168,1082,677,{round:9});
}
// 09
{
const s=slide('A better way to agree a new time',{notes:local+'This slide shows the WhatsApp bot conversation simulator in the admin request detail and the corresponding customer tracking view. The flow supports YES, NO, ANOTHER TIME, numbered time options, common phrases and staff follow-up for unclear replies. The system rechecks availability before confirmation. Actual WhatsApp delivery needs the company Business Platform connection, approved templates where required and a server-side webhook. The customer reference/phone lookup is only a local demonstration. '+sources+disclaimer,foot:'WhatsApp conversation shown in simulation. Live delivery requires the company’s API connection.'});
tx(s,'Staff suggests a slot.\nThe customer can reply.',64,229,580,122,44,C.ink,true);
tx(s,'Available alternatives stay connected\nto the same request. Staff can step in\nwhen a reply needs attention.',64,428,590,145,29,C.muted);
await image(s,'admin-proposal.png',694,171,490,657,{round:8});await image(s,'mobile-tracking.png',1242,171,294,636,{round:12});
}
// 10
{
const s=slide('The workshop, at a glance',{notes:local+'The dashboard brings daily bookings, work in progress, pending repair approvals, ready vehicles and outstanding invoices into one overview. Discuss the decisions the team can make from this screen, without claiming automatic business results. The demo day and figures in the screenshot are sample data. '+sources});
point(s,'What needs attention','The team can see approvals, collection status and balances.',64,232,350);
point(s,'Quick access to the work','Open a job, review an enquiry or move into the diary.',64,472,350);
await image(s,'admin-dashboard.png',450,172,1086,694,{round:9});
}
// 11
{
const s=slide('The job stays connected',{notes:local+'The workshop job workspace includes work and parts, technician notes, inspection findings, estimates, invoices and history. The selected captures show the work/parts view and an inspection finding. Some progress steps require prerequisite tasks or approvals to be resolved. Inspection illustrations and records are simulated. '+sources});
tx(s,'Work & parts',64,168,705,42,30,C.blue,true);tx(s,'Inspection findings',831,168,705,42,30,C.blue,true);
await image(s,'admin-job.png',64,229,705,502,{round:9});await image(s,'admin-inspection.png',831,229,705,502,{round:9});
tx(s,'The team sees the tasks and parts linked to the visit',64,760,705,62,27,C.muted);tx(s,'Findings remain attached to the same job record',831,760,705,62,27,C.muted);
}
// 12
{
const s=slide('Clear quotations for custom work',{notes:local+'Quotations retain scope, total, preferred date, duration and status. Staff can prepare, send in simulation and record customer acceptance or decline, then book accepted work. Separate repair estimate approval workflows also exist in jobs. Project prices shown are examples, not the client’s production price list. No quote or approval is sent to a real customer. '+sources});
tx(s,'The scope and price\nstay together',64,236,670,125,46,C.ink,true);
point(s,'A visible quotation status','Staff can follow a quote from draft to an accepted booking.',64,455,650);
tx(s,'Useful for wrapping, PPF,\nfleet branding and repair estimates',64,686,650,88,29,C.muted);
await image(s,'admin-quote.png',875,170,558,659,{round:9});
}
// 13
{
const s=slide('Invoices and customer history',{notes:local+'Invoice overview shows totals, paid amounts, balances and statuses for demo jobs. Customer and vehicle records retain visits and details. The public View & pay invoice action still links to the client’s existing billing site. The admin does not currently process real payments or provide production accounting. '+sources});
tx(s,'Invoice visibility',64,172,700,44,31,C.blue,true);tx(s,'Customer & vehicle records',836,172,700,44,31,C.blue,true);
await image(s,'admin-invoices.png',64,239,700,465,{round:8});await image(s,'admin-customers.png',836,239,700,465,{round:8});
tx(s,'A clear view of sample balances and payment status',64,746,700,78,27,C.muted);tx(s,'Visit history helps staff keep the context of each vehicle',836,746,700,78,27,C.muted);
}
// 14
{
const s=slide('What this means for DC Motors',{dark:true,notes:'These are intended qualitative benefits of the proposed workflow, not measured savings or revenue guarantees. Use them to invite the client to explain their present booking and workshop process. Suggested pilot measures: submitted requests, response time, confirmed appointments, reschedules and staff feedback. Do not invent targets without a baseline.'});
point(s,'A clearer enquiry path','Customers can move from the right service to a relevant request.',64,230,650,{dark:true});
point(s,'Less repeated information','Customer and vehicle details stay with the enquiry and job.',860,230,650,{dark:true});
point(s,'Better scheduling visibility','Staff can compare provisional requests with confirmed work.',64,509,650,{dark:true});
point(s,'More consistent follow-up','Suggested times and decisions share one request history.',860,509,650,{dark:true});
}
// 15
{
const s=slide('A controlled path to launch',{notes:'Close by agreeing the next scope decisions, not by implying the prototype is already live. The demonstrated local workflows can guide the production implementation. Production needs backend persistence, authenticated roles, secure customer tracking, WhatsApp integration and real delivery handling. Confirm whether invoice payment remains with the existing billing provider. Agree approved client photography, content and scheduling rules. A pilot should test real workshop processes before a public release. '+disclaimer});
tx(s,'The prototype makes the customer journey\nand workshop workflow ready to review',64,184,1390,123,44,C.ink,true);
const rows=[['01','Agree the operating rules','Confirm services, visit durations, resources and approval responsibilities.'],['02','Connect the live services','Add secure accounts, shared data and the company WhatsApp connection.'],['03','Pilot with the workshop team','Test real scheduling scenarios, customer replies and staff handoffs.'],['04','Launch and measure','Use approved content and review enquiry handling and booking outcomes.']];
rows.forEach(([n,h,b],i)=>{let y=357+i*109;tx(s,n,64,y,80,56,40,C.blue,true);tx(s,h,181,y,461,47,29,C.ink,true);tx(s,b,666,y,850,74,27,C.muted);});
}

const draft=path.join(TMP,'candidate.pptx');
await (await PresentationFile.exportPptx(presentation)).save(draft);
const finalPath=path.join(OUT,'DC_Motors_Product_Introduction_2026-10-26.pptx');
await finalizePresentation({workspaceDir:WORK,candidatePath:draft,finalPath,pythonExecutable:path.join(RUNTIME,'python/bin/python3.12'),integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:path.join(TMP,'validation-final.json')});
const finalPresentation=await PresentationFile.importPptx(await FileBlob.load(finalPath));
const pdf=await PDFDocument.create();
for(let i=0;i<finalPresentation.slides.items.length;i++){
 const blob=await finalPresentation.export({slide:finalPresentation.slides.items[i],format:'png',scale:1});
 const bytes=new Uint8Array(await blob.arrayBuffer());
 const file=path.join(TMP,'renders',`slide-${String(i+1).padStart(2,'0')}.png`);await fs.writeFile(file,bytes);
 const embedded=await pdf.embedPng(bytes);const p=pdf.addPage([1200,675]);p.drawImage(embedded,{x:0,y:0,width:1200,height:675});
 console.log(`Rendered ${i+1}`);
}
await fs.writeFile(path.join(OUT,'DC_Motors_Product_Introduction_2026-10-26.pdf'),await pdf.save());
const thumbPaths=[];for(let i=1;i<=15;i++){const p=path.join(TMP,'renders',`slide-${String(i).padStart(2,'0')}.png`);thumbPaths.push(await sharp(p).resize(400,225).toBuffer());}
await sharp({create:{width:1600,height:900,channels:3,background:'#DDE6ED'}}).composite(thumbPaths.map((input,i)=>({input,left:(i%4)*400,top:Math.floor(i/4)*225}))).png().toFile(path.join(TMP,'montage.png'));
console.log(JSON.stringify({finalPath,slides:15,pdf:path.join(OUT,'DC_Motors_Product_Introduction_2026-10-26.pdf')}));
