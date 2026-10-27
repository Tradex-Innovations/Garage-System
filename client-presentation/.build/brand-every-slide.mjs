import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import sharp from 'sharp';
import {FileBlob,PresentationFile} from '@oai/artifact-tool';
import {PDFDocument} from 'pdf-lib';
const WORK=path.resolve('client-presentation'),TMP=path.join(WORK,'.build'),OUT=path.join(WORK,'output');
const SKILL='/Users/sarindusamarasekara/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const RUNTIME='/Users/sarindusamarasekara/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(RUNTIME,'node/node_modules');
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
const source=path.join(OUT,'DC_Motors_Product_Introduction_Logos_Fixed.pptx');
const p=await PresentationFile.importPptx(await FileBlob.load(source));
function label(slide,text,left,top,width,color){let s=slide.shapes.add({geometry:'textbox',position:{left,top,width,height:22},fill:'none',line:{fill:'none',width:0}});s.text=text;s.text.style={typeface:'Arial',fontSize:17,color,verticalAlignment:'top',wrap:'none',insets:0};}
for(let i=0;i<p.slides.items.length;i++){
 const slide=p.slides.items[i],dark=[0,1,13].includes(i),color=dark?'#AEC4D1':'#607785';
 const dc=slide.images.items.find(image=>i===0?Math.abs(image.frame.left-64)<1&&Math.abs(image.frame.width-300)<1:Math.abs(image.frame.left-1190.2172)<1&&Math.abs(image.frame.top-13)<1);
 const tradex=slide.images.items.find(image=>i===0?Math.abs(image.frame.left-64)<1&&Math.abs(image.frame.top-653)<1:Math.abs(image.frame.left-1404)<1&&Math.abs(image.frame.top-13)<1);
 if(!dc||!tradex)throw new Error('Brand pair missing on slide '+(i+1));
 if(i===0){
  tradex.frame={left:64,top:76,width:220,height:67.63};
  dc.frame={left:340,top:82,width:250,height:55.87};
  label(slide,'Presented by',64,45,220,color);
  label(slide,'Prepared for',340,45,250,color);
 }else{
  tradex.frame={left:64,top:30,width:180,height:55.3};
  dc.frame={left:1306,top:32,width:230,height:51.4};
  label(slide,'Presented by',64,7,250,color);
  label(slide,'Prepared for',1306,7,230,color);
  const title=slide.shapes.items.find(s=>Math.abs(s.position.top-58)<1&&Math.abs(s.position.height-95)<1);
  if(!title)throw new Error('Title missing on slide '+(i+1));
  title.position={...title.position,top:88,height:85};
 }
}
const draft=path.join(TMP,'candidate-company-client.pptx');await(await PresentationFile.exportPptx(p)).save(draft);
const finalPath=path.join(OUT,'DC_Motors_Product_Introduction_Company_and_Client.pptx');
await finalizePresentation({workspaceDir:WORK,candidatePath:draft,finalPath,pythonExecutable:path.join(RUNTIME,'python/bin/python3.12'),integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:path.join(TMP,'validation-company-client.json')});
const final=await PresentationFile.importPptx(await FileBlob.load(finalPath));
const renders=path.join(TMP,'company-client-renders');await fs.mkdir(renders,{recursive:true});
const pdf=await PDFDocument.create();let thumbnails=[];
for(let i=0;i<final.slides.items.length;i++){
 const bytes=new Uint8Array(await(await final.export({slide:final.slides.items[i],format:'png',scale:1})).arrayBuffer());
 await fs.writeFile(path.join(renders,`slide-${String(i+1).padStart(2,'0')}.png`),bytes);
 thumbnails.push(await sharp(bytes).resize(400,225).toBuffer());
 const embedded=await pdf.embedPng(bytes),page=pdf.addPage([1200,675]);page.drawImage(embedded,{x:0,y:0,width:1200,height:675});
}
await fs.writeFile(path.join(OUT,'DC_Motors_Product_Introduction_Company_and_Client.pdf'),await pdf.save());
await sharp({create:{width:1600,height:900,channels:3,background:'#DDE6ED'}}).composite(thumbnails.map((input,i)=>({input,left:i%4*400,top:Math.floor(i/4)*225}))).png().toFile(path.join(TMP,'company-client-montage.png'));
console.log(JSON.stringify({finalPath,slides:final.slides.items.length}));
