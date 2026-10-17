"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays, CarFront, Check, CheckCheck, ChevronRight, ClipboardList, FileText, Inbox, Paintbrush, Phone, Plus, Search, Send, ShieldCheck, X } from "lucide-react";
import { DEMO_DATE, SAMPLE_CUSTOMERS, money, dateLabel } from "../lib/demo";
import { REQUEST_TYPES, QUOTE_SERVICES, SERVICE_OPTIONS } from "../lib/business";

const tone = status => ({ New: "blue", "In review": "amber", Quoted: "violet", Confirmed: "green", Closed: "slate", Draft: "slate", Sent: "blue", Accepted: "green", Declined: "rose", Booked: "green" }[status] || "slate");
const iconFor = type => type === "Callback" ? Phone : type === "Wrap / PPF / branding" ? Paintbrush : type === "Repair estimate" ? FileText : CalendarDays;

export function RequestsInbox({ requests, search, onOpen, onNew, Badge }) {
  const [requestType, setRequestType] = useState("All requests");
  const visible = requests.filter(r => (requestType === "All requests" || r.type === requestType) && `${r.id} ${r.customer.name} ${r.customer.reg} ${r.type} ${r.service}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="request-summary">
      {[['New requests', requests.filter(r => r.status === 'New').length, Inbox, 'blue'], ['Being reviewed', requests.filter(r => ['In review', 'Quoted'].includes(r.status)).length, ClipboardList, 'amber'], ['Appointments confirmed', requests.filter(r => r.status === 'Confirmed').length, CheckCheck, 'green']].map(([label, count, Icon, colour]) => <div key={label}><span className={`stat-icon ${colour}`}><Icon size={19} /></span><div><span>{label}</span><strong>{count}</strong></div></div>)}
    </div>
    <section className="panel">
      <div className="panel-header"><div><h2>Customer requests <span className="count">{requests.length}</span></h2><p>Website, phone, email and WhatsApp enquiries, together.</p></div><button className="button primary" onClick={onNew}><Plus size={16} />New request</button></div>
      <div className="request-filter-row"><div className="segmented" role="group" aria-label="Filter requests by type">{["All requests", ...REQUEST_TYPES].map(type => <button className={requestType === type ? "selected" : ""} aria-pressed={requestType === type} key={type} onClick={() => setRequestType(type)}>{type}</button>)}</div></div>
      <div className="table-scroll"><table><thead><tr><th>Customer & vehicle</th><th>Request</th><th>Preferred date</th><th>Source</th><th>Status</th><th /></tr></thead><tbody>{visible.map(request => { const Icon = iconFor(request.type); return <tr key={request.id} onClick={() => onOpen(request.id)}><td><div className="vehicle-cell"><span className={`vehicle-icon ${request.type.includes("Wrap") ? "violet" : "blue"}`}><Icon size={20} /></span><div><strong>{request.customer.name}</strong><small>{request.customer.reg} · {request.customer.vehicle}</small></div></div></td><td><strong>{request.service}</strong><small className="cell-sub">REQ-{request.id} · {request.type}</small></td><td>{request.preferredDate ? dateLabel(request.preferredDate) : "Callback requested"}{request.motPrep === "Yes" && <small className="cell-sub">MOT preparation requested</small>}</td><td>{request.source}</td><td><Badge tone={tone(request.status)}>{request.status}</Badge></td><td><button className="icon-button" aria-label={`Review request ${request.id}`} onClick={() => onOpen(request.id)}><ChevronRight size={17} /></button></td></tr>; })}</tbody></table>{!visible.length && <div className="empty"><Inbox size={28} /><h3>No matching requests</h3><p>Choose another filter or record a new enquiry.</p></div>}</div>
    </section>
    <p className="admin-footnote">Requests are enquiries. They only appear in the diary after staff confirm an appointment.</p>
  </>;
}

export function RequestDetail({ request, quote, Modal, Badge, onClose, onReview, onQuote, onBook, onComplete, onOpenQuote, onOpenJob }) {
  const needsQuote = ["Repair estimate", "Wrap / PPF / branding"].includes(request.type);
  const finished = ["Confirmed", "Closed"].includes(request.status);
  return <Modal title={`Request REQ-${request.id}`} onClose={onClose}>
    <div className="admin-dialog-content">
      <div className="admin-dialog-heading"><div><span className="eyebrow">{request.source.toUpperCase()} ENQUIRY</span><h2>{request.service}</h2></div><Badge tone={tone(request.status)}>{request.status}</Badge></div>
      <div className="request-customer"><span className="vehicle-icon blue"><CarFront size={24} /></span><div><strong>{request.customer.name}</strong><p>{request.customer.vehicle} · <span className="registration">{request.customer.reg}</span></p></div></div>
      <div className="detail-grid"><div><span>Phone</span><strong>{request.customer.phone}</strong></div><div><span>Email</span><strong>{request.customer.email}</strong></div><div><span>Preferred date</span><strong>{request.preferredDate ? dateLabel(request.preferredDate) : "Call customer to arrange"}</strong></div><div><span>MOT preparation</span><strong>{request.type === "MOT booking" ? request.motPrep : "Not applicable"}</strong></div></div>
      <div className="request-message"><span>Customer’s request</span><p>{request.details || "No additional notes provided."}</p></div>
      {quote && <button className="linked-record" onClick={() => onOpenQuote(quote.id)}><FileText size={18} /><span>Quote QUO-{quote.id}<small>{quote.status} · {quote.amount ? money(quote.amount) : "Price to be prepared"}</small></span><ChevronRight size={17} /></button>}
      {request.jobId && <button className="linked-record" onClick={() => onOpenJob(request.jobId)}><WrenchIcon /><span>Confirmed job #{request.jobId}<small>Open the appointment and job workspace</small></span><ChevronRight size={17} /></button>}
      <div className="admin-actions">
        {request.status === "New" && <button className="button secondary" onClick={onReview}><Check size={15} />Mark reviewed</button>}
        {!finished && request.type === "Callback" && <button className="button primary" onClick={onComplete}><Phone size={15} />Mark callback completed</button>}
        {!finished && request.type !== "Callback" && needsQuote && (!quote || quote.status === "Declined") && <button className="button primary" onClick={onQuote}><FileText size={16} />Prepare quotation</button>}
        {!finished && request.type !== "Callback" && (!needsQuote || quote?.status === "Accepted") && <button className="button primary" onClick={onBook}><CalendarDays size={16} />Confirm an appointment</button>}
        {!finished && quote && !["Accepted", "Declined"].includes(quote.status) && <button className="button primary" onClick={() => onOpenQuote(quote.id)}>Manage quote <ArrowRight size={15} /></button>}
      </div>
      <p className="form-footnote">{finished ? "This enquiry has been handled. Its history is retained below." : request.type === "Callback" ? "Record completion after contacting the customer. No calls are made by this demo." : needsQuote ? "Review the scope and agree a price before scheduling the work." : "You’ll choose an available time, bay and technician before confirming."}</p>
      <div className="request-history">{request.history.map((entry, i) => <p key={i}><i />{entry}</p>)}</div>
    </div>
  </Modal>;
}
function WrenchIcon() { return <ClipboardList size={18} />; }

export function RequestForm({ initial = {}, Modal, onClose, onSave }) {
  const [values, setValues] = useState({ type: initial.type || "MOT booking", service: initial.type === "Wrap / PPF / branding" ? "Vehicle wrapping" : initial.type === "Repair estimate" ? "Mechanical repair" : "MOT test", source: "Website", preferredDate: "2026-10-16", motPrep: "No", details: "", customerId: 1, ...SAMPLE_CUSTOMERS[0] });
  const field = (key, value) => setValues(v => ({ ...v, [key]: value }));
  const changeType = type => setValues(v => ({ ...v, type, service: type === "MOT booking" ? "MOT test" : type === "Service booking" ? "Interim service" : type === "Wrap / PPF / branding" ? "Vehicle wrapping" : "Mechanical repair" }));
  const options = values.type === "Service booking" ? SERVICE_OPTIONS : values.type === "Wrap / PPF / branding" ? QUOTE_SERVICES.filter(s => s !== "Mechanical repair") : values.type === "MOT booking" ? ["MOT test"] : ["Mechanical repair", ...SERVICE_OPTIONS, ...QUOTE_SERVICES.filter(s => s !== "Mechanical repair")];
  return <Modal title={initial.createQuote ? "New quotation enquiry" : "Record a customer request"} onClose={onClose}><form onSubmit={e => { e.preventDefault(); const original = SAMPLE_CUSTOMERS.find(c => c.id === Number(values.customerId)); const customer = { id: original && original.reg === values.reg.trim().toUpperCase() && original.name === values.name.trim() ? original.id : Date.now(), name: values.name.trim(), vehicle: values.vehicle.trim(), reg: values.reg.trim().toUpperCase(), phone: values.phone.trim(), email: values.email.trim(), mileage: original?.mileage || "—", initials: values.name.trim().split(/\s+/).map(x => x[0]).slice(0, 2).join(""), motDue: original?.motDue || "2026-11-02", serviceDue: original?.serviceDue || "2027-04-14" }; onSave({ customer, type: values.type, service: values.service, source: values.source, preferredDate: values.type === "Callback" ? "" : values.preferredDate, motPrep: values.type === "MOT booking" ? values.motPrep : "No", details: values.details.trim() }, initial.createQuote); }}>
    <p className="modal-description">Record a website or phone enquiry for staff to review. Use the fictional sample details for the demo.</p>
    <div className="form-grid"><label className="form-field">Request type<select value={values.type} onChange={e => changeType(e.target.value)}>{REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}</select></label><label className="form-field">Source<select value={values.source} onChange={e => field("source", e.target.value)}>{["Website", "Phone", "WhatsApp", "Email"].map(s => <option key={s}>{s}</option>)}</select></label></div>
    <label className="form-field">Use a sample customer<select value={values.customerId} onChange={e => { const customer = SAMPLE_CUSTOMERS.find(c => c.id === Number(e.target.value)); setValues(v => customer ? { ...v, ...customer, customerId: customer.id } : { ...v, customerId: "new", name: "", vehicle: "", reg: "", phone: "", email: "" }); }}>{SAMPLE_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name} — {c.reg}</option>)}<option value="new">New demo customer</option></select></label>
    <label className="form-field">Customer name<input required value={values.name} onChange={e => field("name", e.target.value)} /></label>
    <div className="form-grid"><label className="form-field">Phone<input required type="tel" value={values.phone} onChange={e => field("phone", e.target.value)} /></label><label className="form-field">Email<input required type="email" value={values.email} onChange={e => field("email", e.target.value)} /></label><label className="form-field">Vehicle<input required value={values.vehicle} onChange={e => field("vehicle", e.target.value)} /></label><label className="form-field">Registration<input required value={values.reg} onChange={e => field("reg", e.target.value)} /></label></div>
    <label className="form-field">Service<select value={values.service} onChange={e => field("service", e.target.value)}>{options.map(s => <option key={s}>{s}</option>)}</select></label>
    {values.type !== "Callback" && <label className="form-field">Preferred date<input type="date" required value={values.preferredDate} onChange={e => field("preferredDate", e.target.value)} /></label>}
    {values.type === "MOT booking" && <label className="form-field">MOT preparation requested?<select value={values.motPrep} onChange={e => field("motPrep", e.target.value)}><option>No</option><option>Yes</option></select></label>}
    <label className="form-field">Requested work / enquiry<textarea required placeholder="Describe the service, repair, finish or callback requested…" value={values.details} onChange={e => field("details", e.target.value)} rows={3} /></label>
    <div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit"><Plus size={16} />{initial.createQuote ? "Create draft quote" : "Save request"}</button></div><p className="form-footnote">Saved in the demo only. This does not reserve a diary slot.</p>
  </form></Modal>;
}

export function QuotesScreen({ quotes, search, onOpen, onNew, Badge }) {
  const [filter, setFilter] = useState("All quotes");
  const visible = quotes.filter(q => (filter === "All quotes" || q.status === filter) && `${q.id} ${q.customer.name} ${q.customer.reg} ${q.service}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="panel"><div className="panel-header"><div><h2>Quotations <span className="count">{quotes.length}</span></h2><p>Repair estimates, vehicle wrapping, PPF and fleet branding.</p></div><button className="button primary" onClick={onNew}><Plus size={16} />New quote</button></div><div className="request-filter-row"><div className="segmented">{["All quotes", "Draft", "Sent", "Accepted", "Booked", "Declined"].map(f => <button key={f} className={filter === f ? "selected" : ""} onClick={() => setFilter(f)}>{f}</button>)}</div></div><div className="table-scroll"><table><thead><tr><th>Quotation</th><th>Customer & vehicle</th><th>Work</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{visible.map(q => <tr key={q.id} onClick={() => onOpen(q.id)}><td><strong>QUO-{q.id}</strong><small className="cell-sub">REQ-{q.requestId}</small></td><td><strong>{q.customer.name}</strong><small className="cell-sub">{q.customer.reg} · {q.customer.vehicle}</small></td><td>{q.service}<small className="cell-sub">Preferred: {dateLabel(q.preferredDate)}</small></td><td><strong>{q.amount ? money(q.amount) : "To be priced"}</strong></td><td><Badge tone={tone(q.status)}>{q.status}</Badge></td><td><button className="icon-button" aria-label={`Open quote ${q.id}`} onClick={() => onOpen(q.id)}><ChevronRight size={17} /></button></td></tr>)}</tbody></table>{!visible.length && <div className="empty"><FileText size={28} /><h3>No matching quotes</h3><p>Create one from an enquiry to get started.</p></div>}</div></section>;
}

export function QuoteWorkspace({ quote, Modal, Badge, onClose, onAction, onBook, onOpenJob }) {
  const [scope, setScope] = useState(quote.scope);
  const [amount, setAmount] = useState(quote.amount);
  const [duration, setDuration] = useState(quote.duration);
  const [error, setError] = useState("");
  const action = value => setError(onAction(value, { scope, amount, duration }) || "");
  const editable = quote.status === "Draft";
  return <Modal title={`Quotation QUO-${quote.id}`} onClose={onClose}><div className="admin-dialog-content"><div className="admin-dialog-heading"><div><span className="eyebrow">{quote.service.toUpperCase()}</span><h2>{quote.customer.name}</h2></div><Badge tone={tone(quote.status)}>{quote.status}</Badge></div><div className="request-customer"><span className="vehicle-icon violet"><Paintbrush size={23} /></span><div><strong>{quote.customer.vehicle}</strong><p><span className="registration">{quote.customer.reg}</span> · {quote.customer.phone}</p></div></div><label className="form-field">Scope of work<textarea rows={4} required value={scope} disabled={!editable} onChange={e => setScope(e.target.value)} /></label><div className="form-grid"><label className="form-field">Custom quote total (£)<input type="number" min="0.01" step="0.01" required disabled={!editable} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label><label className="form-field">Workshop time<select value={duration} disabled={!editable} onChange={e => setDuration(e.target.value)}>{[30, 60, 90, 120, 180, 240, 360, 480].map(n => <option key={n} value={n}>{n} minutes</option>)}</select></label></div><div className="quote-summary"><span>Preferred date</span><strong>{dateLabel(quote.preferredDate)}</strong></div>{error && <p className="form-error" role="alert">{error}</p>}
    {editable && <div className="admin-actions"><button className="button secondary" onClick={() => action("save")}>Save draft</button><button className="button primary" onClick={() => action("send")}><Send size={15} />Send quote (demo)</button></div>}
    {quote.status === "Sent" && <div className="staff-decision"><h3>Record the customer’s response</h3><p>After speaking with the customer, record their decision here.</p><div className="admin-actions"><button className="button primary" onClick={() => action("accept")}><Check size={15} />Record accepted</button><button className="button secondary" onClick={() => action("decline")}><X size={15} />Record declined</button></div></div>}
    {quote.status === "Accepted" && <div className="staff-decision"><h3>Approved and ready to schedule.</h3><p>Choose a suitable time, bay and technician to confirm the visit.</p><button className="button primary" onClick={onBook}><CalendarDays size={16} />Book approved quote</button></div>}
    {quote.jobId && <button className="linked-record" onClick={() => onOpenJob(quote.jobId)}><ClipboardList size={18} /><span>Job #{quote.jobId}<small>Confirmed appointment and agreed work</small></span><ChevronRight size={17} /></button>}
    <p className="form-footnote">Admin demo · Quote sending and customer responses are simulated. No portal or email is opened.</p><div className="request-history">{quote.history.map((h, i) => <p key={i}><i />{h}</p>)}</div></div></Modal>;
}

export function MotLookup({ customers, Modal, onClose }) {
  const [reg, setReg] = useState("");
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState(false);
  return <Modal title="Check sample MOT status" onClose={onClose}><form onSubmit={e => { e.preventDefault(); const normalise = s => s.replace(/\s/g, "").toUpperCase(); setResult(customers.find(c => normalise(c.reg) === normalise(reg)) || null); setChecked(true); }}><p className="modal-description">Look up a vehicle from the demo customer records. This does not connect to DVSA.</p><label className="form-field">Vehicle registration<input required value={reg} onChange={e => { setReg(e.target.value); setChecked(false); }} placeholder="e.g. LK19 FWD" /></label><button className="button primary" type="submit"><Search size={16} />Check sample record</button>{checked && (result ? <div className="mot-result"><ShieldCheck size={26} /><div><strong>{result.vehicle}</strong><p>{result.reg} · {result.name}</p><span>Sample MOT due: <b>{dateLabel(result.motDue)}</b></span></div></div> : <p className="form-error" role="status">No sample record found. Try LK19 FWD or BT21 VGL.</p>)}<p className="form-footnote">Sample expiry dates are illustrative and are not official MOT results.</p></form></Modal>;
}
