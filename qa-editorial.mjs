import { renderEditorialPages } from '/dev-server/src/lib/editorialServicesPages.ts';
import { generateLineItemLibraryPdf } from '/dev-server/src/lib/lineItemLibraryPdf.ts';
import fs from 'fs';

// Real-shaped data (no long_description / deliverables / ideal_for)
const templates = [
  { id:'a', title:'Immersive LED Environments & Branded Overlay Design', category:'*Soleia Creative Package', price:4000,
    description:'1–3 transparent logo animations and 1–3 background animations, designed to your mood board and brand. Includes 1 revision.' },
  { id:'b', title:'On-Site Recorded Client Mapped Preview', category:'Additional Items', price:250,
    description:'A recorded walkthrough of your mapped content in the venue, delivered as a video.' },
  { id:'c', title:'In-Person Preview', category:'Additional Items', price:400,
    description:'On-site preview session with a member of the creative team.' },
  { id:'d', title:'Previz Preview', category:'Additional Items', price:350,
    description:'Virtual pre-visualization of your content mapped to the venue in 3D.' },
  { id:'e', title:'Additional Transparent Logo Animation', category:'Additional Options', price:750,
    description:'One extra transparent logo animation.' },
  { id:'f', title:'Elevator Dynamic Animation', category:'Additional Options', price:750,
    description:'Three deliverables: static idle image, ride-up animation, ride-down animation.' },
  { id:'g', title:'Individual dedicated Cabana / Bungalow Logo', category:'Additional Options', price:300,
    description:'One logo placed in a dedicated cabana or bungalow (up to 24).' },
  { id:'h', title:'Previz', category:'Additional Options', price:350,
    description:'Standard previz asset.' },
  { id:'i', title:'Elevator Static Logo (content to spec provided by client)', category:'Load Fee', price:350,
    description:'Static elevator logo. Client provides content to spec.' },
  { id:'j', title:'Mapped by Soleia Creative Team', category:'Load Fee', price:1500,
    description:'Content mapped to venue screens by the Soleia team.' },
  { id:'k', title:'Mapped to spec by Client', category:'Load Fee', price:1000,
    description:'Client provides pre-mapped content to spec.' },
  { id:'l', title:'Outside Arch Specific Video (content to spec provided by client.)', category:'Load Fee', price:500,
    description:'Outside arch video load. Content provided by client.' },
  { id:'m', title:'Performing Artist - Mapped by Soleia Creative Team', category:'Load Fee', price:950,
    description:'Performing artist content mapped by Soleia team.' },
];

const doc = generateLineItemLibraryPdf(templates, []);
fs.writeFileSync('/tmp/pdfqa/out.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('pages:', doc.getNumberOfPages());
