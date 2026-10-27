import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';
import { PDFDocument } from 'pdf-lib';
const WORK=path.resolve('client-presentation');
const TMP=path.join(WORK,'.build');
const OUT=path.join(WORK,'output');
const SKILL='/Users/sarindusamarasekara/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const RUNTIME='/Users/sarindusamarasekara/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(RUNTIME,'node/node_modules');
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
const source=path.join(OUT,'DC_Motors_Product_Introduction_2026-10-26.pptx');
const presentation=await PresentationFile.importPptx(await FileBlob.load(source));
await fs.writeFile(path.join(TMP,'branding-source-inspection.ndjson'),(await presentation.inspect({kind:'layout,slide,image,textbox',maxChars:100000})).ndjson);
const dc=await sharp(path.resolve('Prototype/public/dc-motors-logo.png')).png().toBuffer();
const tradexWhite=await fs.readFile('/Users/sarindusamarasekara/Desktop/Tradex-Innovations/Tradex-innovations.png');
const tradexDark=await fs.readFile('/Users/sarindusamarasekara/Desktop/Tradex-Innovations/TRADEX Innovations Logo.png');
function addImage(slide,blob,alt,position,extra={}){return slide.images.add({blob,contentType:'image/png',alt,fit:'contain',position,...extra});}
for(let i=0;i<presentation.slides.items.length;i++){
 const s=presentation.slides.items[i];
 if(i===0){
  addImage(s,tradexWhite,'Tradex Innovations logo',{left:64,top:653,width:270,height:83},{crop:{left:.14,top:.15,right:.1,bottom:.18}});
 }else{
  addImage(s,dc,'DC Motors UK logo',{left:1190,top:13,width:166,height:37});
  const dark=i===1||i===13;
  addImage(s,dark?tradexWhite:tradexDark,'Tradex Innovations logo',{left:1404,top:13,width:132,height:37},{crop:dark?{left:.14,top:.15,right:.1,bottom:.18}:{left:.08,top:.26,right:.08,bottom:.19}});
 }
 s.speakerNotes.text=s.speakerNotes.text+'\nBrand assets: DC Motors UK original logo in Prototype/public/dc-motors-logo.png. Tradex Innovations original logo artwork from Tradex-innovations.png and TRADEX Innovations Logo.png, using the light or dark lettering variant for contrast. Logos retain their artwork and proportions.';
}
const draft=path.join(TMP,'candidate-branded.pptx');
await (await PresentationFile.exportPptx(presentation)).save(draft);
const finalPath=path.join(OUT,'DC_Motors_Product_Introduction_With_Logos.pptx');
await finalizePresentation({workspaceDir:WORK,candidatePath:draft,finalPath,pythonExecutable:path.join(RUNTIME,'python/bin/python3.12'),integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:path.join(TMP,'validation-logos.json')});
const final=await PresentationFile.importPptx(await FileBlob.load(finalPath));
const pdf=await PDFDocument.create();
const renders=path.join(TMP,'branded-renders');await fs.mkdir(renders,{recursive:true});
let thumbs=[];
for(let i=0;i<final.slides.items.length;i++){
 const bytes=new Uint8Array(await (await final.export({slide:final.slides.items[i],format:'png',scale:1})).arrayBuffer());
 await fs.writeFile(path.join(renders,`slide-${String(i+1).padStart(2,'0')}.png`),bytes);
 thumbs.push(await sharp(bytes).resize(400,225).toBuffer());
 const png=await pdf.embedPng(bytes),page=pdf.addPage([1200,675]);page.drawImage(png,{x:0,y:0,width:1200,height:675});
}
await fs.writeFile(path.join(OUT,'DC_Motors_Product_Introduction_With_Logos.pdf'),await pdf.save());
await sharp({create:{width:1600,height:900,channels:3,background:'#DDE6ED'}}).composite(thumbs.map((input,i)=>({input,left:i%4*400,top:Math.floor(i/4)*225}))).png().toFile(path.join(TMP,'branded-montage.png'));
console.log(JSON.stringify({finalPath,slides:final.slides.items.length}));
