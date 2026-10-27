import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import {FileBlob,PresentationFile} from '@oai/artifact-tool';
import {PDFDocument} from 'pdf-lib';
const WORK=path.resolve('client-presentation'),TMP=path.join(WORK,'.build'),OUT=path.join(WORK,'output');
const SKILL='/Users/sarindusamarasekara/.codex/plugins/cache/openai-primary-runtime/presentations/26.1025.11240/skills/presentations';
const RUNTIME='/Users/sarindusamarasekara/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(RUNTIME,'node/node_modules');
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
const presentation=await PresentationFile.importPptx(await FileBlob.load(path.join(OUT,'DC_Motors_Product_Introduction_With_Logos.pptx')));
const png=await sharp('Prototype/public/dc-motors-logo.png').png().toBuffer();
await fs.writeFile(path.join(TMP,'assets/dc-motors-logo-compatible.png'),png);
let replaced=0;
for(let i=0;i<presentation.slides.items.length;i++){
 const slide=presentation.slides.items[i];
 const logo=slide.images.items.find(image=>i===0?Math.abs(image.frame.left-64)<1&&Math.abs(image.frame.width-300)<1:Math.abs(image.frame.left-1190.2172)<1&&Math.abs(image.frame.top-13)<1);
 if(!logo)throw new Error(`DC Motors logo missing on slide ${i+1}`);
 const frame=logo.frame,crop=logo.crop,fit=logo.fit;
 logo.replace({blob:png,contentType:'image/png',alt:'DC Motors UK logo',fit});
 logo.frame=frame;logo.crop=crop;
 replaced++;
}
await (await PresentationFile.exportPptx(presentation)).save(path.join(TMP,'candidate-png-logos.pptx'));
const finalPath=path.join(OUT,'DC_Motors_Product_Introduction_Logos_Fixed.pptx');
await finalizePresentation({workspaceDir:WORK,candidatePath:path.join(TMP,'candidate-png-logos.pptx'),finalPath,pythonExecutable:path.join(RUNTIME,'python/bin/python3.12'),integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,receiptPath:path.join(TMP,'validation-png-logos.json')});
const deck=await PresentationFile.importPptx(await FileBlob.load(finalPath));
const pdf=await PDFDocument.create();
const renderDir=path.join(TMP,'compatible-renders');await fs.mkdir(renderDir,{recursive:true});
for(let i=0;i<deck.slides.items.length;i++){
 const bytes=new Uint8Array(await (await deck.export({slide:deck.slides.items[i],format:'png',scale:1})).arrayBuffer());
 await fs.writeFile(path.join(renderDir,`slide-${String(i+1).padStart(2,'0')}.png`),bytes);
 const embed=await pdf.embedPng(bytes),page=pdf.addPage([1200,675]);page.drawImage(embed,{x:0,y:0,width:1200,height:675});
}
await fs.writeFile(path.join(OUT,'DC_Motors_Product_Introduction_Logos_Fixed.pdf'),await pdf.save());
console.log(JSON.stringify({replaced,finalPath}));
