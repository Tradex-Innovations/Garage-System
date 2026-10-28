import { BAYS, SERVICES, TECHNICIANS, dateLabel, findConflict, minutes, openingHours, timeLabel } from "./demo.js";
import { confirmBooking } from "./business.js";

const pad = value => String(value).padStart(2, "0");
export const workshopDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export const workshopMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  return Number(parts.find(p => p.type === "hour")?.value) * 60 + Number(parts.find(p => p.type === "minute")?.value);
};
export const addDays = (date, amount) => {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + amount);
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
};
export const visitDuration = service => SERVICES[service]?.quoteOnly || service === "Mechanical repair" ? 60 : SERVICES[service]?.duration || 60;
const resources = service => service === "MOT test" ? [{ bay: BAYS[2], technician: TECHNICIANS[1] }] : [
  { bay: BAYS[0], technician: TECHNICIANS[0] },
  { bay: BAYS[1], technician: TECHNICIANS[2] },
];
const overlaps = (a, b) => a.date === b.date && minutes(a.time) < minutes(b.time) + Number(b.duration) && minutes(a.time) + Number(a.duration) > minutes(b.time);
const heldSlots = (workspace, excludeRequestId) => workspace.requests.flatMap(request => {
  if (request.id === excludeRequestId) return [];
  if (request.bookingState === "Pending" && request.slot) return [request.slot];
  if (request.bookingState === "Awaiting reply" && request.proposal) return [request.proposal];
  return [];
});

export function bookingConflict(workspace, booking, excludeJobId, excludeRequestId) {
  const jobConflict = findConflict(workspace.jobs, booking, excludeJobId);
  if (jobConflict) return jobConflict;
  const hold = heldSlots(workspace, excludeRequestId).find(slot => overlaps(booking, slot) && (slot.bay === booking.bay || slot.technician === booking.technician));
  return hold ? `This time is held for a customer booking request. Choose another bay or time.` : "";
}

export function availableAssignment(workspace, date, time, service, options = {}) {
  const duration = Number(options.duration || visitDuration(service));
  const today = options.today || workshopDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time || "") || !Number.isFinite(duration) || duration <= 0) return null;
  const hours = openingHours(date);
  if (!hours || date < today || (date === today && minutes(time) <= (options.nowMinutes ?? workshopMinutes()) + 30)) return null;
  if (minutes(time) < hours.start || minutes(time) + duration > hours.end) return null;
  const holds = heldSlots(workspace, options.excludeRequestId);
  for (const resource of resources(service)) {
    const candidate = { date, time, duration, service, ...resource };
    if (findConflict(workspace.jobs, candidate)) continue;
    if (holds.some(hold => overlaps(candidate, hold) && (hold.bay === resource.bay || hold.technician === resource.technician))) continue;
    return candidate;
  }
  return null;
}

export function availableSlots(workspace, date, service, options = {}) {
  const hours = openingHours(date);
  const today = options.today || workshopDate();
  if (!hours || date < today) return [];
  const duration = Number(options.duration || visitDuration(service));
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const timing = { ...options, duration, today, nowMinutes: options.nowMinutes ?? (date === today ? workshopMinutes() : 0) };
  const result = [];
  for (let start = hours.start; start + duration <= hours.end; start += 30) {
    const candidate = availableAssignment(workspace, date, timeLabel(start), service, timing);
    if (candidate) result.push(candidate);
  }
  return result;
}

const appendMessage = (request, direction, body) => ({ ...request, messages: [...(request.messages || []), { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, direction, body, at: new Date().toISOString(), simulated: true }] });
const withEvent = (request, event) => ({ ...request, history: [event, ...request.history] });
const updateRequest = (workspace, id, transform) => ({ ...workspace, requests: workspace.requests.map(request => request.id === id ? transform(request) : request) });
const active = request => request && !request.jobId && !["Closed", "Confirmed", "Rejected"].includes(request.status);

export function acceptRequestedSlot(workspace, id, chosen) {
  const request = workspace.requests.find(item => item.id === id);
  if (!active(request)) return { error: "This request can no longer be booked." };
  const desired = chosen || (request.bookingState === "Awaiting reply" ? request.proposal : request.slot);
  if (!desired) return { error: "Choose an available slot first." };
  const slot = availableAssignment(workspace, desired.date, desired.time, request.service, { duration: desired.duration, excludeRequestId: id });
  if (!slot) return { error: "That slot is no longer available. Choose another time." };
  const quote = workspace.quotes.find(item => item.id === request.quoteId);
  const consultation = ["Repair estimate", "Wrap / branding"].includes(request.type) && quote?.status !== "Accepted";
  const bookingService = consultation ? "Other" : request.service;
  const result = confirmBooking(workspace, { ...slot, service: bookingService, requestId: id, quoteId: consultation ? null : request.quoteId || null, consultation, scope: consultation ? `Initial consultation for ${request.service}` : request.details, notes: request.details, motPrep: request.motPrep }, request.customer);
  if (result.error) return result;
  let next = updateRequest(result.workspace, id, current => ({ ...withEvent(current, `${consultation ? "Consultation" : "Appointment"} confirmed for ${dateLabel(slot.date)} at ${slot.time}.`), bookingState: "Confirmed", slot, proposal: null, alternatives: [], preferredDate: slot.date, preferredTime: slot.time }));
  if (request.whatsappOptIn) next = updateRequest(next, id, current => appendMessage(current, "out", `Confirmed: ${dateLabel(slot.date)} at ${slot.time} for ${request.customer.reg}. Reference REQ-${id}. (Prototype message, not sent.)`));
  return { workspace: next, jobId: result.jobId };
}

export function rejectBookingRequest(workspace, id, reason = "") {
  const request = workspace.requests.find(item => item.id === id);
  if (!active(request)) return { error: "This request can no longer be declined." };
  let next = updateRequest(workspace, id, current => ({ ...withEvent(current, `Booking request declined by staff${reason ? `: ${reason}` : "."}`), status: "Rejected", bookingState: "Rejected", proposal: null, alternatives: [] }));
  if (request.whatsappOptIn) next = updateRequest(next, id, current => appendMessage(current, "out", `We cannot confirm your requested visit${reason ? `: ${reason}` : "."} Please contact DC Motors to arrange another time. (Prototype message, not sent.)`));
  return { workspace: next };
}

export function rescheduleAppointment(workspace, jobId, values) {
  const job = workspace.jobs.find(item => item.id === jobId);
  if (!job) return { error: "The appointment could not be found." };
  const slot = { date: values.date, time: values.time, duration: Number(values.duration), bay: values.bay, technician: values.technician };
  const conflict = bookingConflict(workspace, { ...slot, service: job.service }, jobId, job.requestId);
  if (conflict) return { error: conflict };
  const event = `Appointment moved to ${dateLabel(slot.date)} at ${slot.time}.`;
  let next = { ...workspace, jobs: workspace.jobs.map(item => item.id === jobId ? { ...item, ...slot, history: [event, ...item.history] } : item) };
  if (job.requestId) next = updateRequest(next, job.requestId, request => {
    const updated = { ...withEvent(request, event), slot: { ...request.slot, ...slot }, preferredDate: slot.date, preferredTime: slot.time };
    return request.whatsappOptIn ? appendMessage(updated, "out", `Your appointment has moved to ${dateLabel(slot.date)} at ${slot.time}. Reference REQ-${request.id}. Contact the workshop if this does not work for you. (Prototype message, not sent.)`) : updated;
  });
  return { workspace: next };
}

export function proposeBookingSlot(workspace, id, date, time) {
  const request = workspace.requests.find(item => item.id === id);
  if (!active(request)) return { error: "This request can no longer be changed." };
  const slot = availableAssignment(workspace, date, time, request.service, { excludeRequestId: id });
  if (!slot) return { error: "That slot is unavailable. Choose a free date and time." };
  let next = updateRequest(workspace, id, current => ({ ...withEvent(current, `Alternative proposed: ${dateLabel(date)} at ${time}. Awaiting customer reply.`), bookingState: "Awaiting reply", status: "In review", proposal: slot, alternatives: [] }));
  if (request.whatsappOptIn) next = updateRequest(next, id, current => appendMessage(current, "out", `DC Motors: ${dateLabel(date)} at ${time} is available for ${request.customer.reg}. Reply YES, NO or ANOTHER TIME. Reference REQ-${id}. (Prototype message, not sent.)`));
  return { workspace: next };
}

function offerOtherSlots(workspace, request, prefix = "") {
  const alternatives = [];
  const start = request.proposal?.date && request.proposal.date >= workshopDate() ? request.proposal.date : workshopDate();
  for (let day = 0; day < 21 && alternatives.length < 3; day++) {
    for (const slot of availableSlots(workspace, addDays(start, day), request.service, { excludeRequestId: request.id })) {
      if (slot.date === request.proposal?.date && slot.time === request.proposal?.time) continue;
      alternatives.push(slot);
      if (alternatives.length === 3) break;
    }
  }
  const message = alternatives.length ? `Other available times: ${alternatives.map((slot, i) => `${i + 1}. ${dateLabel(slot.date)} ${slot.time}`).join(" · ")}. Reply 1, 2 or 3, or ask for staff. (Prototype bot reply.)` : "No alternative times are available right now. A staff member will help. (Prototype bot reply.)";
  return { workspace: updateRequest(workspace, request.id, current => appendMessage({ ...withEvent(current, "Bot offered current availability after a customer reply."), bookingState: alternatives.length ? "Choosing time" : "Needs follow-up", proposal: null, alternatives }, "out", `${prefix}${message}`)) };
}

export function replyToProposal(workspace, id, reply, choice) {
  const request = workspace.requests.find(item => item.id === id);
  if (!active(request) || !["Awaiting reply", "Choosing time"].includes(request.bookingState)) return { error: "There is no active time proposal for this request." };
  const value = String(reply).trim().toLowerCase().replace(/[.!?,]/g, "").replace(/\s+/g, " ");
  if (!choice && request.bookingState === "Choosing time" && /^[1-3]$/.test(value)) choice = request.alternatives?.[Number(value) - 1];
  let next = updateRequest(workspace, id, current => appendMessage(current, "in", choice ? `Selected ${dateLabel(choice.date)} at ${choice.time}` : reply));
  if (["yes", "y", "yes please", "yes that works", "yes confirm", "confirm", "confirmed", "ok", "okay", "that works", "sounds good"].includes(value) && request.proposal) {
    const result = acceptRequestedSlot(next, id, request.proposal);
    return result.error ? offerOtherSlots(next, request, "That time is no longer available. ") : result;
  }
  if (choice) {
    if (!(request.alternatives || []).some(slot => slot.date === choice.date && slot.time === choice.time)) return { error: "Choose a time offered in this conversation." };
    const result = acceptRequestedSlot(next, id, choice);
    return result.error ? offerOtherSlots(next, request, "That time is no longer available. ") : result;
  }
  if (["no", "n", "no thanks", "no thank you", "decline"].includes(value)) {
    next = updateRequest(next, id, current => appendMessage({ ...withEvent(current, "Customer declined the proposed time. Staff follow-up needed."), bookingState: "Needs follow-up", proposal: null, alternatives: [] }, "out", "Understood. The workshop will help arrange another time. (Prototype bot reply.)"));
    return { workspace: next };
  }
  if (value === "another" || /\b(another|different|other) (time|date|day|slot)s?\b/.test(value) || value === "reschedule") return offerOtherSlots(next, request);
  if (["stop", "unsubscribe"].includes(value)) return { workspace: updateRequest(next, id, current => appendMessage({ ...withEvent(current, "Customer opted out of WhatsApp updates. Staff follow-up needed."), whatsappOptIn: false, bookingState: "Needs follow-up", proposal: null, alternatives: [] }, "out", "WhatsApp updates are turned off for this request. Your booking request remains with the workshop. (Prototype bot reply.)")) };
  next = updateRequest(next, id, current => appendMessage({ ...withEvent(current, "Customer reply needs staff review."), bookingState: "Needs follow-up", proposal: null, alternatives: [] }, "out", "Thanks. A team member will reply and help you find a suitable time. (Prototype bot reply.)"));
  return { workspace: next };
}
