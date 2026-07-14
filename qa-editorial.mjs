import { renderEditorialPages } from '/dev-server/src/lib/editorialServicesPages.ts';
import jsPDF from 'jspdf';
import fs from 'fs';

const doc = new jsPDF({ unit: 'pt', format: 'letter' });
doc.setFontSize(20); doc.text('QA Cover', 60, 100);

const templates = [
  { id:'1', title:'Creative Direction', category:'Creative Direction', price:5000, sort_order:1,
    ideal_for:'brand launches and cinematic hero pieces',
    long_description:'We shape the narrative arc of your event from first sketch through final frame. Our creative directors partner with your team to translate brand voice, mood, and objective into a bespoke visual language executed across every surface at the venue.',
    deliverables:['Kickoff strategy session','Mood board and reference deck','Visual system and color script','Weekly creative reviews'] },
  { id:'2', title:'Storyboarding', category:'Creative Direction', price:1500, sort_order:2,
    ideal_for:'complex multi-scene productions',
    long_description:'Frame-by-frame boards mapped to the venue architecture so nothing is left to chance.',
    deliverables:['Full storyboard set','Shot list','Screen placement plan'] },
  { id:'3', title:'On-Site Content Capture', category:'Content Production', price:8500, sort_order:1,
    ideal_for:'events wanting hero video and recap-ready coverage',
    long_description:'A cinema-grade capture team documents the night with intent: hero moments, ambient texture, guest reactions, and clean broadcast plates for post.',
    deliverables:['Lead cinematographer + 2 operators','Full audio capture','Same-night selects','All raw footage on hard drive'] },
  { id:'4', title:'Post-Production & Color', category:'Post-Production', price:6000, sort_order:1,
    ideal_for:'polished recap films and brand-ready deliverables',
    long_description:'Editorial cut, sound design, color grade, and final mastering across delivery formats. Two revision rounds included.',
    deliverables:['Hero recap film (60-90s)','Vertical social cut','DCP and web masters','Two revision rounds'] },
  { id:'5', title:'DXV3 Encoding & Delivery', category:'On-Site Services', price:1200, sort_order:1,
    ideal_for:'Resolume-based media servers',
    long_description:'We hand off final content pre-encoded and folder-organized for the media server team, tested against the venue playback rig.',
    deliverables:['DXV3 encodes at native pixel map','Delivery via Dropbox','On-call support day-of'] },
];

const intros = [
  { name:'Creative Direction', intro:'Every project begins with a point of view. Our creative direction sets the tone, defines the visual grammar, and gives your production team a single source of truth.', sort_order:1 },
  { name:'Content Production', intro:'Cinema-grade capture calibrated for the venue you have chosen.', sort_order:2 },
  { name:'Post-Production', intro:'Editorial, sound, and color under one roof.', sort_order:3 },
  { name:'On-Site Services', intro:'Delivery and day-of support so the room feels effortless.', sort_order:4 },
];

renderEditorialPages(doc, templates, intros, { sectionTitle:'Our Services', sectionKicker:'The Editorial Guide' });
fs.writeFileSync('/tmp/pdfqa/out.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('pages:', doc.getNumberOfPages());
