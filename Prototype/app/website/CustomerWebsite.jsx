'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CarFront, Check, CheckCheck, ChevronDown, ChevronsLeftRight, ClipboardCheck, Clock3, ExternalLink, Gauge, MapPin, Menu, MessageCircle, Paintbrush, Phone, Receipt, Search, Send, ShieldCheck, Sparkles, Truck, Upload, Wrench, X } from 'lucide-react';
import { services } from './services';
import { withBasePath } from '../../lib/paths';
import { STORAGE_KEY } from '../../lib/demo';
import { addRequest, restoreWorkspace, seedWorkspace } from '../../lib/business';
import { availableAssignment, replyToProposal } from '../../lib/scheduling';
import SlotPicker from '../../components/SlotPicker';

const icons = { ClipboardCheck, Gauge, Wrench, Paintbrush, Truck };
const maps = 'https://www.google.com/maps/search/?api=1&query=DC+Motors+Ltd+Neptune+Business+Park+Cheltenham+GL51+9FB';
const whatsapp = 'https://wa.me/447598041341';
const publicReceipts = 'dc-motors-public-demo-receipts';
const faq = [
  ['Is my appointment confirmed when I submit a request?', 'Choose an available date and time on the calendar. The workshop reviews your request and can confirm it or offer another time. You can reply to suggested times from Track request. WhatsApp messages are simulated in this prototype.'],
  ['Can I get a quote before bringing my car in?', 'Yes. Choose a repair, wrapping or branding quote and describe what you need. Photos can help explain your enquiry. Some work may require an inspection before a final price can be agreed.'],
  ['Do you offer MOT preparation?', 'Yes. Select MOT & preparation and let us know that you would like a preparation check. The team can discuss what your vehicle needs before the test.'],
  ['Can I pay my invoice online?', 'The View & pay invoice link opens the existing DC Motors billing website. Payments are handled there, outside this prototype.'],
  ['Where are you and when are you open?', 'Find us at Unit 02, Neptune Business Park, Cheltenham, GL51 9FB. Published opening hours are Monday to Friday, 9:30am–6pm and Saturday, 9:30am–3pm. Closed on Sunday.'],
];

function Icon({ name, ...props }) { const Component = icons[name] || CarFront; return <Component aria-hidden="true" {...props} />; }
function Eyebrow({ children, light = false }) { return <p className={`dc-eyebrow ${light ? 'dc-eyebrow-light' : ''}`}><span />{children}</p>; }
function readWorkspace() { const raw = localStorage.getItem(STORAGE_KEY); return raw ? restoreWorkspace(JSON.parse(raw)) : seedWorkspace(); }

export default function CustomerWebsite({ serviceSlug }) {
  const selected = services.find(s => s.slug === serviceSlug);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [finish, setFinish] = useState('Ocean blue');
  const [comparison, setComparison] = useState(55);
  const [motReg, setMotReg] = useState('');
  const [motResult, setMotResult] = useState(false);
  const root = useRef(null);
  const home = '/website/';
  function openRequest(slug = 'servicing') { setMenu(false); setModal({ kind: 'request', slug }); }

  useEffect(() => {
    const nodes = root.current?.querySelectorAll('[data-reveal]') || [];
    if (!window.IntersectionObserver || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('dc-in-view'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    nodes.forEach(node => { node.classList.add('dc-will-reveal'); observer.observe(node); });
    return () => observer.disconnect();
  }, []);

  return <div className="dc-site" ref={root}>
    <a className="dc-skip" href="#main">Skip to content</a>
    <div className="dc-utility"><div className="dc-container"><span><MapPin size={13} /> Your local garage. Cheltenham.</span><div><span className="dc-hours"><Clock3 size={13} /> Mon–Fri 9:30–18:00 · Sat 9:30–15:00</span><a href="tel:+441242783053"><Phone size={13} />01242 783053</a><a href="https://billing.dcmotorsltd.co.uk/" target="_blank" rel="noreferrer"><Receipt size={13} />View & pay invoice<ArrowUpRight size={12} /></a></div></div></div>
    <header className="dc-header"><div className="dc-container dc-nav">
      <Link className="dc-logo" href={home} aria-label="DC Motors home"><img src={withBasePath('/dc-motors-logo.png')} width="205" height="64" alt="DC Motors UK" /></Link>
      <nav aria-label="Main navigation" className={menu ? 'dc-nav-links dc-nav-open' : 'dc-nav-links'}>
        <a href={`${withBasePath(home)}#services`} onClick={() => setMenu(false)}>Our services<ChevronDown size={13} /></a>
        <a href={`${withBasePath(home)}#customise`} onClick={() => setMenu(false)}>Wraps & branding</a>
        <a href={`${withBasePath(home)}#about`} onClick={() => setMenu(false)}>Our workshop</a>
        <a href={`${withBasePath(home)}#contact`} onClick={() => setMenu(false)}>Find us</a>
        <button className="dc-nav-track" onClick={() => { setMenu(false); setModal({ kind: 'track' }); }}><Search size={15} />Track request</button>
      </nav>
      <button className="dc-btn dc-primary dc-nav-book" onClick={() => openRequest()}><CalendarDays size={17} />Book a visit<ArrowUpRight size={16} /></button>
      <button className="dc-menu" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
    </div></header>

    <main id="main">
      {selected ? <>
        <section className="dc-service-hero dc-container">
          <Link href={`${home}#services`} className="dc-back"><ArrowLeft size={16} />All services</Link>
          <div className="dc-service-hero-grid"><div><Eyebrow>{selected.tag} / CHELTENHAM</Eyebrow><h1>{selected.title}<span>With care, by DC.</span></h1><p>{selected.intro}</p><button className="dc-btn dc-primary" onClick={() => openRequest(selected.slug)}><Icon name={selected.icon} size={18} />{selected.action}<ArrowUpRight size={18} /></button></div><img src={withBasePath(`/website/${selected.image}`)} alt={`${selected.short} automotive inspiration`} /></div>
        </section>
        <section className="dc-container dc-service-details" data-reveal><div><Eyebrow>MADE STRAIGHTFORWARD</Eyebrow><h2>A clear next step.<br />A car in good hands.</h2></div><div>{selected.includes.map((item, i) => <div className="dc-inclusion" key={item}><span>0{i + 1}</span><h3>{item}</h3><Check size={20} /></div>)}</div></section>
      </> : <>
        <section className="dc-hero">
          <img className="dc-hero-image" src={withBasePath('/website/hero.jpg')} alt="Black performance car on the open road" fetchPriority="high" />
          <div className="dc-hero-shade" />
          <div className="dc-hero-content"><Eyebrow light>PRECISION. PASSION. PEACE OF MIND.</Eyebrow><h1>Your car.<br /><span>Our craft.</span></h1><p>From the everyday essentials to a whole new look.<br className="dc-desktop-break" /> Expert car care, right here in Cheltenham.</p><div className="dc-hero-actions"><button className="dc-btn dc-primary" onClick={() => openRequest()}><CalendarDays size={18} />Book a service<ArrowUpRight size={18} /></button><button className="dc-btn dc-glass" onClick={() => openRequest('wrapping')}><Paintbrush size={18} />Get a custom quote</button></div></div>
          <div className="dc-hero-caption"><span>DRIVEN BY THE DETAILS</span><p>Maintained. Repaired. Personalised.</p></div>
          <a className="dc-explore" href="#services" aria-label="Explore our services"><ArrowDown size={19} /></a>
          <span className="dc-hero-index">01 / THE DC DIFFERENCE</span>
        </section>
        <div className="dc-trust-strip dc-container"><span><Wrench />Mechanical know-how</span><i /><span><ShieldCheck />Care with confidence</span><i /><span><Paintbrush />A finish that feels like you</span><i /><span><MapPin />One Cheltenham workshop</span></div>
      </>}

      <section id="services" className="dc-section dc-container">
        <div className="dc-section-heading" data-reveal><div><Eyebrow>ONE WORKSHOP. EVERY DETAIL.</Eyebrow><h2>{selected ? 'More ways to care for your car.' : <>Whatever your car needs.<br /><span>We’re here for it.</span></>}</h2></div></div>
        <div className="dc-services">{services.filter(s => s.slug !== selected?.slug).map((s, i) => <Link href={`${home}services/${s.slug}/`} className={`dc-service-card ${i === 3 ? 'dc-featured-service' : ''}`} key={s.slug} data-reveal style={{ '--delay': `${i % 3 * 70}ms` }}><div className="dc-card-top"><span className="dc-service-icon"><Icon name={s.icon} size={27} /></span><span className="dc-card-number">0{services.indexOf(s) + 1}</span></div><span className="dc-card-tag">{s.tag}</span><h3>{s.title}</h3><div className="dc-card-bottom"><span>Explore service</span><span className="dc-card-arrow"><ArrowUpRight size={19} /></span></div></Link>)}</div>
      </section>

      <section id="mot" className="dc-container" data-reveal><div className="dc-mot"><div className="dc-mot-icon"><ClipboardCheck size={34} /></div><div className="dc-mot-copy"><Eyebrow>ONE LESS THING TO REMEMBER</Eyebrow><h2>MOT coming up?</h2><p>Start with your registration. We’ll help with the next step.</p></div><form onSubmit={e => { e.preventDefault(); setMotResult(true); }} className="dc-mot-form"><label className="dc-registration"><span>UK</span><input aria-label="Vehicle registration for MOT" required pattern="[A-Za-z0-9 ]{2,10}" maxLength={10} placeholder="YOUR REG" value={motReg} onChange={e => { setMotReg(e.target.value.toUpperCase()); setMotResult(false); }} /></label><button className="dc-btn dc-dark" type="submit"><Search size={17} />Check MOT<ArrowRight size={17} /></button><small>Prototype preview · no live DVSA lookup</small></form>{motResult && <div className="dc-mot-result" role="status"><ShieldCheck size={21} /><div><strong>Ready to check {motReg}?</strong><p>For an official result, use the GOV.UK checker. This demo does not retrieve vehicle records.</p><a href="https://www.gov.uk/check-mot-status" target="_blank" rel="noreferrer">Open official MOT checker <ExternalLink size={13} /></a></div><button className="dc-btn dc-primary" onClick={() => setModal({ kind: 'request', slug: 'mot', reg: motReg })}><CalendarDays size={16} />Request an MOT</button></div>}</div></section>

      <section id="customise" className="dc-customise"><div className="dc-container"><div className="dc-section-heading" data-reveal><div><Eyebrow light>YOUR VISION. OUR ATTENTION TO DETAIL.</Eyebrow><h2>Same car.<br /><span>Different feeling.</span></h2></div><button className="dc-text-link" onClick={() => openRequest('wrapping')}><Paintbrush size={18} />Let’s create your new look<ArrowUpRight size={18} /></button></div>
        <div className="dc-finish-layout" data-reveal><div className="dc-comparison" style={{ '--split': `${comparison}%`, '--finish-filter': finish === 'Ocean blue' ? 'sepia(.5) saturate(2) hue-rotate(155deg)' : finish === 'Warm bronze' ? 'sepia(.8) saturate(1.2)' : 'grayscale(1) brightness(.65)' }}><img className="dc-after" src={withBasePath('/website/finish.jpg')} alt={`Illustrative ${finish.toLowerCase()} vehicle finish`} loading="lazy" /><div className="dc-before"><img src={withBasePath('/website/finish.jpg')} alt="Original vehicle photograph" loading="lazy" /></div><span className="dc-compare-label dc-label-before">ORIGINAL</span><span className="dc-compare-label dc-label-after">FINISH CONCEPT</span><div className="dc-divider"><span><ChevronsLeftRight size={23} /></span></div><input type="range" min="0" max="100" value={comparison} onChange={e => setComparison(Number(e.target.value))} aria-label="Compare original and concept finish" aria-valuetext={`${comparison}% original image visible`} /><span className="dc-compare-hint">Drag to explore the difference</span></div>
          <div className="dc-finish-panel"><span className="dc-card-tag">THE FINISH EXPLORER</span><h3>A little inspiration<br /> for your next chapter.</h3><p>Explore a few colour moods, then tell us what you have in mind.</p><div className="dc-swatches" role="group" aria-label="Choose concept finish">{[['Ocean blue', '#2585ba'], ['Warm bronze', '#aa7f50'], ['Graphite', '#66717d']].map(([label, colour]) => <button key={label} aria-label={label} aria-pressed={finish === label} onClick={() => setFinish(label)} style={{ '--swatch': colour }}>{finish === label && <Check size={17} />}</button>)}</div><strong>{finish}</strong><button className="dc-btn dc-primary" onClick={() => setModal({ kind: 'request', slug: 'wrapping', details: `I’m interested in a ${finish.toLowerCase()} finish.` })}><Sparkles size={17} />Make it yours<ArrowUpRight size={17} /></button></div></div>
        <div className="dc-custom-options">{services.slice(3).map(s => <Link key={s.slug} href={`${home}services/${s.slug}/`}><Icon name={s.icon} size={22} /><span>{s.title}</span><ArrowUpRight size={18} /></Link>)}</div>
      </div></section>

      <section className="dc-section dc-container dc-process" data-reveal><div><Eyebrow>LESS HASSLE. MORE OPEN ROAD.</Eyebrow><h2>Great car care.<br /><span>Three simple steps.</span></h2><button className="dc-text-link" onClick={() => openRequest()}><CalendarDays size={18} />Start your request<ArrowRight size={18} /></button></div><div className="dc-steps">{[['01', 'Tell us what you need', 'Choose a service and an available calendar slot, then share your vehicle details.', CarFront], ['02', 'We agree the details', 'Our team reviews your enquiry and confirms the work and appointment.', MessageCircle], ['03', 'Leave it in our hands', 'Bring your vehicle in and we’ll take care of the agreed work.', CheckCheck]].map(([n, title, text, StepIcon]) => <div className="dc-step" key={n}><span className="dc-step-number">{n}</span><div><h3>{title}</h3><p>{text}</p></div><StepIcon size={23} /></div>)}</div></section>

      <section id="about" className="dc-container dc-about" data-reveal><div className="dc-about-photo"><img src={withBasePath('/website/workshop.jpg')} alt="Close-up of mechanical engine components" loading="lazy" /><span><Wrench size={19} />IT’S THE DETAILS THAT DRIVE US.</span></div><div className="dc-about-copy"><Eyebrow>MEET YOUR LOCAL WORKSHOP</Eyebrow><h2>Proper care.<br />Personal service.</h2><p>At DC Motors, we believe good car care starts with an honest conversation. From keeping your daily drive in shape to bringing a new look to life, we take pride in doing the work properly.</p><div className="dc-values"><div><Check />Clear advice, before the work begins</div><div><Check />Servicing, repairs and customisation together</div><div><Check />Right here in Cheltenham</div></div><a href={maps} target="_blank" rel="noreferrer" className="dc-text-link"><MessageCircle size={18} />Find us & read customer reviews<ArrowUpRight size={18} /></a></div></section>

      <section className="dc-container dc-sales" data-reveal><div><Eyebrow>YOUR NEXT CHAPTER</Eyebrow><h2>Looking for a<br />different set of keys?</h2><p>Explore the vehicles on our dedicated used-car website.</p><a href="https://carsales.dcmotorsltd.co.uk/" target="_blank" rel="noreferrer" className="dc-btn dc-dark"><CarFront size={18} />Explore used cars<ArrowUpRight size={18} /></a></div><img src={withBasePath('/website/car-sales.jpg')} loading="lazy" alt="Automotive inspiration for your next car, not a stock listing" /><span>INSPIRATION IMAGE · VIEW LIVE STOCK ON OUR SALES SITE</span></section>

      <section className="dc-container dc-section dc-faq" data-reveal><div><Eyebrow>A FEW HELPFUL ANSWERS</Eyebrow><h2>Before you<br /><span>hand over the keys.</span></h2><p>Something else on your mind?</p><a href={whatsapp} target="_blank" rel="noreferrer" className="dc-text-link"><MessageCircle size={18} />Chat with us on WhatsApp<ArrowUpRight size={18} /></a></div><div className="dc-questions">{faq.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div></section>

      <section id="contact" className="dc-contact"><div className="dc-container"><div className="dc-contact-heading"><Eyebrow light>GOOD TO MEET YOU. BETTER TO HELP YOU.</Eyebrow><h2>Let’s get you<br /><span>on your way.</span></h2><button className="dc-btn dc-white" onClick={() => openRequest()}><CalendarDays size={18} />Book your next visit<ArrowUpRight size={19} /></button></div><div className="dc-contact-details"><div><MapPin size={22} /><h3>Drop by the workshop</h3><p>Unit 02, Neptune Business Park<br />Cheltenham, GL51 9FB</p><a href={maps} target="_blank" rel="noreferrer">Get directions<ArrowUpRight size={16} /></a></div><div><Clock3 size={22} /><h3>When we’re here</h3><p>Monday–Friday <b>9:30am–6pm</b><br />Saturday <b>9:30am–3pm</b><br />Sunday <b>Closed</b></p></div><div><Phone size={22} /><h3>Let’s talk cars</h3><a href="tel:+441242783053">01242 783053<ArrowUpRight size={16} /></a><a href="tel:+447598041341">07598 041341<ArrowUpRight size={16} /></a><a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp us<MessageCircle size={16} /></a></div></div></div></section>
    </main>

    <footer className="dc-footer"><div className="dc-container"><div className="dc-footer-top"><Link className="dc-logo" href={home}><img src={withBasePath('/dc-motors-logo.png')} width="190" height="60" alt="DC Motors UK" /></Link><p>Care for the journey.<br />Craft for the individual.</p><a href="https://billing.dcmotorsltd.co.uk/" target="_blank" rel="noreferrer"><Receipt size={17} />View & pay invoice<ArrowUpRight size={15} /></a><Link href="/"><Gauge size={17} />Workshop demo<ArrowUpRight size={15} /></Link></div><div className="dc-footer-bottom"><span>© {new Date().getFullYear()} DC Motors Ltd.</span><span>Local prototype · stock imagery · no live bookings or messages</span><button onClick={() => setModal({ kind: 'privacy' })}>Prototype privacy</button></div></div></footer>
    <div className="dc-mobile-actions"><a href="tel:+441242783053"><Phone size={18} />Call</a><a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} />WhatsApp</a><button onClick={() => openRequest()}><CalendarDays size={18} />Book a visit</button></div>
    {modal && <WebsiteDialog modal={modal} close={() => setModal(null)} />}
  </div>;
}

function WebsiteDialog({ modal, close }) {
  const dialog = useRef(null);
  const [step, setStep] = useState(1);
  const [slug, setSlug] = useState(modal.slug || 'servicing');
  const [form, setForm] = useState({ reg: modal.reg || '', vehicle: '', slot: null, visit: true, details: modal.details || '', name: '', email: '', phone: '', motPrep: false, sms: false, whatsapp: false });
  const [workspacePreview, setWorkspacePreview] = useState(seedWorkspace);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [tracking, setTracking] = useState(null);
  const service = services.find(s => s.slug === slug);
  const isQuote = ['repairs', 'wrapping', 'branding'].includes(slug);
  const wantsVisit = !isQuote || form.visit;
  useEffect(() => { const element = dialog.current; element.showModal(); return () => { if (element.open) element.close(); }; }, []);
  useEffect(() => { const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = previous; }; }, []);
  useEffect(() => { try { setWorkspacePreview(readWorkspace()); } catch {} }, []);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  function submit(e) {
    e.preventDefault(); setError('');
    if (step === 1) {
      if (wantsVisit && !form.slot) { setError('Choose an available date and time on the calendar.'); return; }
      setStep(2); return;
    }
    if (!form.name.trim() || !form.vehicle.trim() || !form.reg.trim()) { setError('Please enter your name and vehicle details.'); return; }
    if (!/^(?:\+44|0)[\d\s()-]{9,16}$/.test(form.phone.trim())) { setError('Please enter a UK phone number starting with 0 or +44.'); return; }
    try {
      const workspace = readWorkspace();
      const slot = wantsVisit ? availableAssignment(workspace, form.slot.date, form.slot.time, service.service) : null;
      if (wantsVisit && !slot) { setStep(1); setWorkspacePreview(workspace); setError('That time has just become unavailable. Please choose another slot.'); return; }
      const id = Math.max(0, ...workspace.requests.map(r => r.customer.id), ...workspace.jobs.map(j => j.customer.id)) + 1;
      const customer = { id, name: form.name.trim(), vehicle: form.vehicle.trim(), reg: form.reg.replace(/\s/g, '').toUpperCase(), phone: form.phone.trim(), email: form.email.trim(), initials: form.name.trim().split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase(), mileage: '—', motDue: '', serviceDue: '' };
      const result = addRequest(workspace, { customer, type: service.type, service: service.service, preferredDate: slot?.date || '', ...(slot ? { preferredTime: slot.time, slot, bookingState: 'Pending' } : {}), details: `${form.details.trim() || service.title + ' enquiry.'}${files.length ? `\nPhoto references (names only; not uploaded): ${files.map(f => f.name).join(', ')}` : ''}\nSMS service updates: ${form.sms ? 'requested (demo only)' : 'not requested'}.`, motPrep: form.motPrep ? 'Yes' : 'No', source: 'Website', smsUpdates: form.sms, whatsappOptIn: form.whatsapp, messages: [] });
      result.workspace.requests[0].history = [slot ? `Customer selected ${slot.date} at ${slot.time}. Awaiting workshop approval.` : 'Customer requested a quotation without a workshop visit.'];
      // Write the authoritative workspace first; optional receipt history must not cause duplicate retries.
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, ...result.workspace }));
      try { const old = JSON.parse(localStorage.getItem(publicReceipts) || '[]'); localStorage.setItem(publicReceipts, JSON.stringify([...old, result.requestId])); } catch {}
      setReceipt(result.requestId);
    } catch { setError('The request could not be saved in this browser. Please allow local storage and try again.'); }
  }
  function track(e) {
    e.preventDefault(); setError(''); setTracking(null);
    const data = new FormData(e.currentTarget);
    const id = Number(String(data.get('reference')).toUpperCase().replace(/^REQ-/, ''));
    const normalise = value => String(value).replace(/\D/g, '').replace(/^44/, '0');
    try {
      const request = readWorkspace().requests.find(r => r.id === id && normalise(r.customer.phone) === normalise(data.get('phone')));
      if (!request) { setError('No matching request in this browser. Check the reference and phone number.'); return; }
      setTracking(request);
    } catch { setError('Local request data is unavailable in this browser.'); }
  }
  function respond(reply, choice) {
    try {
      const current = readWorkspace();
      const result = replyToProposal(current, tracking.id, reply, choice);
      if (result.error) { setError(result.error); return; }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, ...result.workspace }));
      setTracking(result.workspace.requests.find(r => r.id === tracking.id));
      setError('');
    } catch { setError('The reply could not be saved in this browser.'); }
  }
  return <dialog className="dc-dialog" ref={dialog} onCancel={close} onClick={e => { if (e.target === e.currentTarget) close(); }} aria-labelledby="dc-dialog-title"><div className="dc-dialog-inner"><button className="dc-dialog-close" onClick={close} aria-label="Close dialog"><X size={22} /></button>
    {modal.kind === 'privacy' ? <><Eyebrow>ABOUT THIS PREVIEW</Eyebrow><h2 id="dc-dialog-title">Your prototype data</h2><p>This is a local website prototype. Demo enquiries are stored in this browser and shared with the workshop demo on the same address. Anyone using this browser can view that demo data.</p><p>Use fictional details. Selected photos are not uploaded or saved; only their filenames are included in the request. No SMS, email, WhatsApp, booking confirmation or payment is sent.</p><p>External links open the client’s existing services or third-party websites, which have their own privacy policies. Clearing this site’s browser data removes the local demo records.</p><button className="dc-btn dc-primary" onClick={close}><Check size={17} />Understood</button></> : modal.kind === 'track' ? <><Eyebrow>YOUR REQUEST, AT A GLANCE</Eyebrow><h2 id="dc-dialog-title">Track your request</h2><p>Use the reference and phone number from your enquiry. This preview checks records in this browser only.</p><form className="dc-form" onSubmit={track}><label>Request reference<input name="reference" placeholder="REQ-2008" required pattern="([Rr][Ee][Qq]-)?[0-9]+" /></label><label>Phone number<input name="phone" type="tel" required placeholder="07700 900123" /></label><button className="dc-btn dc-primary" type="submit"><Search size={17} />Find my request</button></form>{tracking && <div className="dc-tracking-result" role="status"><span className="dc-status-pill">{tracking.bookingState || tracking.status}</span><h3>{tracking.service}</h3><p>REQ-{tracking.id} · {tracking.customer.reg}</p>{tracking.slot && <p>Requested: {tracking.slot.date} at {tracking.slot.time}</p>}{tracking.proposal && <p>Workshop suggestion: <strong>{tracking.proposal.date} at {tracking.proposal.time}</strong></p>}<p>{tracking.status === 'Confirmed' ? 'Your visit is confirmed in the workshop demo.' : tracking.status === 'Rejected' ? 'The workshop could not accept this booking request.' : 'Your chosen time is awaiting workshop approval.'}</p>{tracking.bookingState === 'Awaiting reply' && <div className="dc-reply-actions"><button className="dc-btn dc-primary" onClick={() => respond('yes')}><Check size={16} />Yes, confirm</button><button className="dc-btn dc-outline" onClick={() => respond('another time')}><CalendarDays size={16} />Another time</button><button className="dc-btn dc-outline" onClick={() => respond('no')}><X size={16} />No</button></div>}{tracking.bookingState === 'Choosing time' && <div className="dc-reply-actions">{(tracking.alternatives || []).map(slot => <button className="dc-btn dc-outline" key={`${slot.date}-${slot.time}`} onClick={() => respond('slot', slot)}><Clock3 size={16} />{slot.date} · {slot.time}</button>)}</div>}{!!tracking.messages?.length && <div className="dc-chat-preview"><strong><MessageCircle size={16} /> WhatsApp conversation preview</strong>{tracking.messages.map(message => <p key={message.id} className={message.direction === 'out' ? 'out' : 'in'}>{message.body}</p>)}</div>}<ol>{tracking.history.slice(0, 3).map((event, i) => <li key={i}>{event}</li>)}</ol></div>}</> : receipt ? <div className="dc-success"><span className="dc-success-icon"><CheckCheck size={34} /></span><Eyebrow>THANK YOU. YOU’RE ON OUR RADAR.</Eyebrow><h2 id="dc-dialog-title">{wantsVisit ? 'Booking request received.' : 'Quote request received.'}</h2><p>Your demo reference is <strong>REQ-{receipt}</strong>.</p><div className="dc-receipt"><Icon name={service.icon} size={27} /><div><strong>{service.title}</strong><span>{form.reg.toUpperCase()} · {form.vehicle}</span>{wantsVisit && form.slot && <span>Requested: {form.slot.date} at {form.slot.time}</span>}</div></div><p>{wantsVisit ? 'The workshop will review this slot. It is held as a request until staff confirm it.' : 'Your quote request is saved in the workshop inbox. No visit has been requested.'} WhatsApp replies are simulated here; no message has been sent.</p><button className="dc-btn dc-primary" onClick={close}><Check size={17} />All done</button><Link className="dc-text-link" href="/"><Gauge size={17} />View workshop demo<ArrowUpRight size={17} /></Link></div> : <><Eyebrow>LET’S TAKE CARE OF YOUR CAR</Eyebrow><h2 id="dc-dialog-title">{isQuote ? wantsVisit ? 'Book a consultation.' : 'Request a quote.' : 'Choose your visit.'}</h2><p>{isQuote ? wantsVisit ? 'Choose a consultation time, then tell us about your project. The work itself is quoted separately.' : 'Tell us about your project for a tailored quote.' : 'Pick an available date and time. The workshop will review your request.'}</p><div className="dc-form-steps"><span className={step === 1 ? 'dc-current-step' : ''}><b>{step > 1 ? <Check size={12} /> : '1'}</b>Vehicle & time</span><i /><span className={step === 2 ? 'dc-current-step' : ''}><b>2</b>Your details</span></div><form className="dc-form" onSubmit={submit}>
      {step === 1 ? <>
        <label>How can we help?<select value={slug} onChange={e => { setSlug(e.target.value); update('slot', null); }}>{services.map(s => <option key={s.slug} value={s.slug}>{s.title}</option>)}</select></label>
        <div className="dc-form-grid"><label>Vehicle registration<input required maxLength={10} pattern="[A-Za-z0-9 ]{2,10}" autoCapitalize="characters" placeholder="AB12 CDE" value={form.reg} onChange={e => update('reg', e.target.value.toUpperCase())} /></label><label>Make & model<input required maxLength={100} placeholder="e.g. Volkswagen Golf" value={form.vehicle} onChange={e => update('vehicle', e.target.value)} /></label></div>
        {isQuote && <label className="dc-checkbox"><input type="checkbox" checked={form.visit} onChange={e => update('visit', e.target.checked)} /><span>I’d like to visit for a consultation.<small>Untick to request a quote without choosing a visit.</small></span></label>}
        {wantsVisit && <SlotPicker workspace={workspacePreview} service={service.service} selected={form.slot} onChange={slot => update('slot', slot)} id="website-booking-calendar" />}
        {slug === 'mot' && <label className="dc-checkbox"><input type="checkbox" checked={form.motPrep} onChange={e => update('motPrep', e.target.checked)} />I’d also like an MOT preparation check.</label>}
        <label>{isQuote ? 'Tell us about your project' : 'Anything we should know?'}<textarea rows={3} maxLength={2000} required={isQuote} placeholder={isQuote ? 'The finish, coverage or repair you have in mind…' : 'A warning light, an unusual noise, or any special requests…'} value={form.details} onChange={e => update('details', e.target.value)} /></label>
        {isQuote && <label className="dc-upload"><Upload size={19} /><span>Add reference photos <small>Up to 3 images, 5 MB each. Preview only; files are not uploaded.</small></span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => { const next = Array.from(e.target.files || []); if (next.length > 3 || next.some(f => f.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(f.type))) { setError('Choose up to 3 JPG, PNG or WebP images, each under 5 MB.'); e.target.value = ''; setFiles([]); return; } setError(''); setFiles(next); }} />{files.length > 0 && <small>{files.map(f => f.name).join(', ')}</small>}</label>}
        <button type="submit" className="dc-btn dc-primary">Continue<ArrowRight size={18} /></button>
      </> : <>
        <label>Your name<input autoFocus autoComplete="name" required maxLength={100} value={form.name} onChange={e => update('name', e.target.value)} placeholder="Alex Taylor" /></label>
        <div className="dc-form-grid"><label>Phone number<input type="tel" autoComplete="tel" required maxLength={20} placeholder="07700 900123" value={form.phone} onChange={e => update('phone', e.target.value)} /></label><label>Email address<input type="email" autoComplete="email" required maxLength={150} placeholder="alex@example.com" value={form.email} onChange={e => update('email', e.target.value)} /></label></div>
        <label className="dc-checkbox"><input type="checkbox" checked={form.whatsapp} onChange={e => update('whatsapp', e.target.checked)} /><span>I agree to receive WhatsApp updates about this request from DC Motors.<small>You can reply to proposed times. This prototype only shows a conversation preview.</small></span></label>
        <label className="dc-checkbox"><input type="checkbox" checked={form.sms} onChange={e => update('sms', e.target.checked)} /><span>I’d like SMS updates about this request.<small>Service updates only. Sending is simulated in this prototype.</small></span></label>
        <label className="dc-checkbox"><input type="checkbox" required /><span>I understand this saves a demo request in this browser.<small>{wantsVisit ? 'The workshop must confirm the time. ' : ''}Use fictional details.</small></span></label>
        <div className="dc-form-actions"><button className="dc-btn dc-outline" type="button" onClick={() => { setStep(1); setError(''); }}><ArrowLeft size={17} />Back</button><button className="dc-btn dc-primary" type="submit"><Send size={17} />{wantsVisit ? 'Request this slot' : 'Request a quote'}</button></div>
      </>}
    </form><div className="dc-form-footnote"><ShieldCheck size={14} />Local prototype · no messages or payments are sent.</div></>}
    {error && <p className="dc-error" role="alert">{error}</p>}
  </div></dialog>;
}
