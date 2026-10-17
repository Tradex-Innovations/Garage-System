import { DEMO_DATE, SAMPLE_CUSTOMERS, SERVICES, createJob, findConflict, seedJobs } from "./demo.js";

export const REQUEST_TYPES = ["MOT booking", "Service booking", "Repair estimate", "Wrap / PPF / branding", "Callback"];
export const QUOTE_SERVICES = ["Vehicle wrapping", "PPF protection", "Fleet branding", "Mechanical repair"];
export const SERVICE_OPTIONS = ["Interim service", "Full service", "Parts replacement", "Other"];
export const REQUEST_STATUSES = ["New", "In review", "Quoted", "Confirmed", "Closed"];
export const QUOTE_STATUSES = ["Draft", "Sent", "Accepted", "Declined", "Booked"];

export function seedRequests() {
  const base = (id, customerIndex, type, service, details, date = "2026-10-16") => ({
    id, customer: SAMPLE_CUSTOMERS[customerIndex], type, service, details, preferredDate: date,
    motPrep: "No", source: "Website", status: "New", jobId: null, quoteId: null,
    history: ["Sample website enquiry received. Appointment is not confirmed."],
  });
  return [
    { ...base(2001, 1, "MOT booking", "MOT test", "Please check the car before its MOT.", "2026-10-17"), motPrep: "Yes" },
    base(2002, 6, "Wrap / PPF / branding", "Vehicle wrapping", "Satin dark-blue colour change. Please quote for the whole vehicle."),
    { ...base(2003, 3, "Wrap / PPF / branding", "PPF protection", "Clear film on the bonnet, front bumper and mirrors."), status: "In review", quoteId: 3001 },
    { ...base(2004, 5, "Callback", "Mechanical repair", "Please call about a brake noise before arranging a visit."), preferredDate: "", source: "Phone" },
    base(2005, 0, "Service booking", "Interim service", "Interim service and a check of the tyre pressures."),
    base(2006, 4, "Repair estimate", "Mechanical repair", "An estimate for an intermittent engine warning light."),
    { ...base(2007, 7, "Wrap / PPF / branding", "Fleet branding", "Company logos and contact details on one Transit van.", "2026-10-17"), status: "Quoted", quoteId: 3002 },
  ];
}
export function seedQuotes() {
  return [
    { id: 3001, requestId: 2003, customer: SAMPLE_CUSTOMERS[3], service: "PPF protection", scope: "Clear PPF for front bumper, bonnet and mirror caps. Includes preparation and fitting.", amount: 450, preferredDate: "2026-10-16", duration: 120, status: "Draft", jobId: null, history: ["Sample quotation drafted by staff."] },
    { id: 3002, requestId: 2007, customer: SAMPLE_CUSTOMERS[7], service: "Fleet branding", scope: "Supply and fit company branding on both sides and rear of one Ford Transit. Artwork supplied by customer.", amount: 325, preferredDate: "2026-10-17", duration: 120, status: "Sent", jobId: null, history: ["Quotation sent (simulated). Awaiting customer response."] },
  ];
}
export function seedWorkspace() { return { jobs: seedJobs(), requests: seedRequests(), quotes: seedQuotes() }; }
export function restoreWorkspace(saved) {
  const fallback = seedWorkspace();
  const validJobs = saved && [1, 2].includes(saved.version) && Array.isArray(saved.jobs) && saved.jobs.every(j => j.customer && Array.isArray(j.items) && Array.isArray(j.payments) && Array.isArray(j.history));
  if (!validJobs) return fallback;
  const jobs = saved.version === 1 ? saved.jobs.map(j => ({ ...j,
    date: j.date === "2026-10-14" ? DEMO_DATE : j.date,
    time: [1042, 1049].includes(j.id) && ["09:00", "08:00"].includes(j.time) ? "09:30" : j.time,
  })) : saved.jobs;
  const validRequests = Array.isArray(saved.requests) && saved.requests.every(r => r.customer && Array.isArray(r.history));
  const validQuotes = Array.isArray(saved.quotes) && saved.quotes.every(q => q.customer && Array.isArray(q.history));
  return { jobs, requests: saved.version === 2 && validRequests ? saved.requests : fallback.requests, quotes: saved.version === 2 && validQuotes ? saved.quotes : fallback.quotes };
}
export function addRequest(workspace, values) {
  const id = Math.max(2000, ...workspace.requests.map(r => r.id)) + 1;
  const request = { ...values, id, status: "New", jobId: null, quoteId: null, history: [`${values.source} enquiry recorded by staff. Not yet a confirmed appointment.`] };
  return { workspace: { ...workspace, requests: [request, ...workspace.requests] }, requestId: id };
}
export function draftQuote(workspace, requestId) {
  const request = workspace.requests.find(r => r.id === requestId);
  if (!request || ["Closed", "Confirmed"].includes(request.status)) return { error: "This request is closed or already confirmed." };
  const existing = workspace.quotes.find(q => q.requestId === requestId && q.status !== "Declined");
  if (existing) return { workspace, quoteId: existing.id };
  const id = Math.max(3000, ...workspace.quotes.map(q => q.id)) + 1;
  const quote = { id, requestId, customer: request.customer, service: request.service, scope: request.details,
    amount: "", preferredDate: request.preferredDate || DEMO_DATE, duration: SERVICES[request.service]?.duration || 60,
    status: "Draft", jobId: null, history: ["Draft created from the customer request."] };
  return { quoteId: id, workspace: { ...workspace, quotes: [quote, ...workspace.quotes], requests: workspace.requests.map(r => r.id === requestId ? { ...r, quoteId: id, status: "In review", history: ["Quotation draft prepared.", ...r.history] } : r) } };
}
export function updateQuote(workspace, id, action, fields = {}) {
  const quote = workspace.quotes.find(q => q.id === id);
  if (!quote) return { error: "Quotation not found." };
  const request = workspace.requests.find(r => r.id === quote.requestId);
  if (!request || ["Closed", "Confirmed"].includes(request.status)) return { error: "The linked request is closed or already confirmed." };
  if (["save", "send"].includes(action) && quote.status !== "Draft") return { error: "Only draft quotations can be edited." };
  if (["accept", "decline"].includes(action) && quote.status !== "Sent") return { error: "Send the quotation before recording a response." };
  const editing = ["save", "send"].includes(action);
  const amount = !editing || fields.amount === undefined ? quote.amount : Math.round(Number(fields.amount) * 100) / 100;
  const scope = (editing ? fields.scope ?? quote.scope : quote.scope).trim();
  const duration = editing ? Number(fields.duration ?? quote.duration) : quote.duration;
  if (["save", "send"].includes(action) && (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !scope)) return { error: "Enter the work description and a positive quote total." };
  if (!Number.isFinite(duration) || duration <= 0 || duration > 480) return { error: "Choose a workshop duration between 30 and 480 minutes." };
  const status = { save: "Draft", send: "Sent", accept: "Accepted", decline: "Declined" }[action];
  if (!status) return { error: "Unknown quotation action." };
  const event = { save: "Draft saved by staff.", send: "Quote sent (simulated).", accept: "Customer acceptance recorded by staff (demo).", decline: "Customer decline recorded by staff (demo)." }[action];
  return { workspace: { ...workspace,
    quotes: workspace.quotes.map(q => q.id === id ? { ...q, amount: Number(amount), scope, duration, status, history: [event, ...q.history] } : q),
    requests: workspace.requests.map(r => r.id === quote.requestId ? { ...r, status: action === "decline" ? "In review" : action === "save" ? "In review" : "Quoted", history: [event, ...r.history] } : r),
  } };
}
export function confirmBooking(workspace, booking, customer) {
  const request = booking.requestId && workspace.requests.find(r => r.id === booking.requestId);
  const quote = booking.quoteId && workspace.quotes.find(q => q.id === booking.quoteId);
  if (booking.requestId && !request) return { error: "The linked request could not be found." };
  if (request && (request.jobId || ["Closed", "Confirmed"].includes(request.status))) return { error: "This request is already confirmed or closed." };
  if (booking.quoteId && (!quote || quote.status !== "Accepted" || quote.jobId)) return { error: "Record acceptance of this quotation before confirming an appointment." };
  if (quote && (!request || quote.requestId !== request.id || quote.customer.id !== customer.id)) return { error: "The quotation must match this customer request." };
  if (request && ["Repair estimate", "Wrap / PPF / branding"].includes(request.type) && !quote) return { error: "Prepare a quotation and record acceptance before booking this request." };
  const service = quote && !SERVICES[quote.service] ? "Other" : booking.service;
  const agreed = { ...booking, service, quotePrice: quote ? quote.amount : booking.quotePrice, scope: quote ? quote.scope : booking.scope };
  const conflict = findConflict(workspace.jobs, agreed);
  if (conflict) return { error: conflict };
  const id = Math.max(1041, ...workspace.jobs.map(j => j.id)) + 1;
  let job;
  try { job = createJob(id, customer, agreed); } catch(e) { return { error: e.message }; }
  if (quote) { job.service = quote.service; job.items[0] = { ...job.items[0], description: quote.scope, price: quote.amount, type: "Quoted project" }; }
  if (request?.motPrep === "Yes") job.notes.unshift("Customer requested MOT preparation before the test.");
  return { jobId: id, workspace: { ...workspace, jobs: [...workspace.jobs, job],
    requests: workspace.requests.map(r => r.id === booking.requestId ? { ...r, status: "Confirmed", jobId: id, history: [`Appointment confirmed as job #${id}.`, ...r.history] } : r),
    quotes: workspace.quotes.map(q => q.id === booking.quoteId ? { ...q, status: "Booked", jobId: id, history: [`Accepted quote booked as job #${id}.`, ...q.history] } : q),
  } };
}
