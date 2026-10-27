import {FileBlob,PresentationFile} from '@oai/artifact-tool';
const p=await PresentationFile.importPptx(await FileBlob.load('client-presentation/output/DC_Motors_Product_Introduction_With_Logos.pptx'));
console.log((await p.inspect({kind:'image',search:'DC Motors',maxChars:22000})).ndjson);
console.log(JSON.stringify(p.slides.items.map(s=>s.images.items.map(i=>({id:i.id,frame:i.frame}))),null,2));
