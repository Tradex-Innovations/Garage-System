import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_CUSTOMERS, openingHours } from "../lib/demo.js";
import { addRequest, draftQuote, seedWorkspace } from "../lib/business.js";
import { acceptRequestedSlot, addDays, availableSlots, bookingConflict, proposeBookingSlot, rejectBookingRequest, replyToProposal, rescheduleAppointment, workshopDate } from "../lib/scheduling.js";

function nextOpenDay(after = workshopDate()) {
  let date = addDays(after, 1);
  while (!openingHours(date)) date = addDays(date, 1);
  return date;
}
function requestAt(workspace, service = "MOT test", type = "MOT booking") {
  const slot = availableSlots(workspace, nextOpenDay(), service)[0];
  assert.ok(slot);
  const result = addRequest(workspace, { customer: SAMPLE_CUSTOMERS[0], type, service, details: "Test visit", source: "Website", slot, preferredDate: slot.date, preferredTime: slot.time, bookingState: "Pending", whatsappOptIn: true, messages: [] });
  return { workspace: result.workspace, id: result.requestId, slot };
}

test("MOT requests reserve a lane, respect durations and disappear after decline", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  assert.ok(!availableSlots(workspace, slot.date, "MOT test").some(item => item.time === slot.time || item.time === "10:00"));
  const result = rejectBookingRequest(workspace, id, "Workshop unavailable");
  assert.equal(result.workspace.requests[0].status, "Rejected");
  assert.ok(availableSlots(result.workspace, slot.date, "MOT test").some(item => item.time === slot.time));
});

test("two service ramps can accept simultaneous requests but a third cannot", () => {
  const first = requestAt(seedWorkspace(), "Full service", "Service booking");
  const second = requestAt(first.workspace, "Full service", "Service booking");
  assert.equal(first.slot.time, second.slot.time);
  assert.notEqual(first.slot.bay, second.slot.bay);
  assert.ok(!availableSlots(second.workspace, first.slot.date, "Full service").some(item => item.time === first.slot.time));
  assert.match(bookingConflict(second.workspace, { ...first.slot, service: "Full service" }), /held/);
});

test("accepting a requested slot creates one linked confirmed job", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  const result = acceptRequestedSlot(workspace, id);
  assert.ok(!result.error);
  const request = result.workspace.requests.find(item => item.id === id);
  const job = result.workspace.jobs.find(item => item.id === result.jobId);
  assert.equal(request.bookingState, "Confirmed");
  assert.equal(request.jobId, job.id);
  assert.equal(job.date, slot.date);
  assert.equal(job.time, slot.time);
  assert.ok(acceptRequestedSlot(result.workspace, id).error);
});

test("a proposal releases the original hold and YES confirms the proposed time", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  const proposal = availableSlots(workspace, nextOpenDay(slot.date), "MOT test", { excludeRequestId: id })[0];
  const proposed = proposeBookingSlot(workspace, id, proposal.date, proposal.time);
  assert.ok(availableSlots(proposed.workspace, slot.date, "MOT test").some(item => item.time === slot.time));
  assert.ok(!availableSlots(proposed.workspace, proposal.date, "MOT test").some(item => item.time === proposal.time));
  const reply = replyToProposal(proposed.workspace, id, "YES");
  assert.ok(!reply.error);
  assert.equal(reply.workspace.jobs.find(job => job.id === reply.jobId).date, proposal.date);
  assert.equal(reply.workspace.requests.find(item => item.id === id).messages.length, 3);
});

test("ANOTHER TIME offers current availability and a selected option confirms", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  const proposed = proposeBookingSlot(workspace, id, slot.date, slot.time);
  const reply = replyToProposal(proposed.workspace, id, "another time");
  const request = reply.workspace.requests.find(item => item.id === id);
  assert.equal(request.bookingState, "Choosing time");
  assert.equal(request.alternatives.length, 3);
  const selected = replyToProposal(reply.workspace, id, "slot", request.alternatives[0]);
  assert.ok(selected.jobId);
});

test("stale offered times cannot create overlapping jobs", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  const proposed = proposeBookingSlot(workspace, id, slot.date, slot.time);
  const conflictJob = { id: 9999, date: slot.date, time: slot.time, duration: slot.duration, bay: slot.bay, technician: slot.technician, service: "MOT test", status: "Booked", customer: SAMPLE_CUSTOMERS[1] };
  const changed = { ...proposed.workspace, jobs: [...proposed.workspace.jobs, conflictJob] };
  const result = replyToProposal(changed, id, "yes");
  assert.equal(result.workspace.jobs.length, changed.jobs.length);
  assert.equal(result.workspace.requests.find(item => item.id === id).bookingState, "Choosing time");
  assert.match(result.workspace.requests.find(item => item.id === id).messages.at(-1).body, /no longer available/);
});

test("NO and ambiguous messages release the proposal and hand off to staff", () => {
  for (const reply of ["NO", "I need to discuss collection"] ) {
    const { workspace, id, slot } = requestAt(seedWorkspace());
    const proposed = proposeBookingSlot(workspace, id, slot.date, slot.time);
    const result = replyToProposal(proposed.workspace, id, reply);
    const request = result.workspace.requests.find(item => item.id === id);
    assert.equal(request.bookingState, "Needs follow-up");
    assert.equal(request.proposal, null);
    assert.equal(result.workspace.jobs.length, workspace.jobs.length);
  }
});

test("quote categories book a consultation without inventing a project price", () => {
  const { workspace, id } = requestAt(seedWorkspace(), "Vehicle wrapping", "Wrap / branding");
  const result = acceptRequestedSlot(workspace, id);
  const job = result.workspace.jobs.find(item => item.id === result.jobId);
  assert.match(job.service, /Consultation/);
  assert.equal(job.items[0].price, 0);
  assert.equal(job.items[0].type, "Consultation");
  assert.ok(draftQuote(result.workspace, id).quoteId);
});

test("Sundays and past dates expose no bookable times", () => {
  let sunday = nextOpenDay();
  while (openingHours(sunday)) sunday = addDays(sunday, 1);
  assert.deepEqual(availableSlots(seedWorkspace(), sunday, "MOT test"), []);
  assert.deepEqual(availableSlots(seedWorkspace(), addDays(workshopDate(), -1), "MOT test"), []);
});

test("staff rescheduling keeps the job, request and message preview consistent", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  const confirmed = acceptRequestedSlot(workspace, id);
  const next = availableSlots(confirmed.workspace, nextOpenDay(slot.date), "MOT test")[0];
  const result = rescheduleAppointment(confirmed.workspace, confirmed.jobId, next);
  const job = result.workspace.jobs.find(item => item.id === confirmed.jobId);
  const request = result.workspace.requests.find(item => item.id === id);
  assert.equal(job.date, next.date);
  assert.equal(request.slot.date, next.date);
  assert.equal(request.slot.time, next.time);
  assert.match(request.messages.at(-1).body, /has moved/);
});

test("WhatsApp opt-out still saves the proposal without an outbound message", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  workspace.requests.find(item => item.id === id).whatsappOptIn = false;
  const result = proposeBookingSlot(workspace, id, slot.date, slot.time);
  const request = result.workspace.requests.find(item => item.id === id);
  assert.equal(request.bookingState, "Awaiting reply");
  assert.deepEqual(request.messages, []);
});

test("natural reply phrases and numbered options follow the same safe transitions", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  const proposed = proposeBookingSlot(workspace, id, slot.date, slot.time);
  const offered = replyToProposal(proposed.workspace, id, "Can you suggest another time?");
  const selected = replyToProposal(offered.workspace, id, "2");
  assert.ok(selected.jobId);
  const another = requestAt(seedWorkspace());
  const suggestion = proposeBookingSlot(another.workspace, another.id, another.slot.date, another.slot.time);
  assert.ok(replyToProposal(suggestion.workspace, another.id, "Yes please!").jobId);
});

test("STOP opts out and retains an open request for staff follow-up", () => {
  const { workspace, id, slot } = requestAt(seedWorkspace());
  const result = replyToProposal(proposeBookingSlot(workspace, id, slot.date, slot.time).workspace, id, "STOP");
  const request = result.workspace.requests.find(item => item.id === id);
  assert.equal(request.whatsappOptIn, false);
  assert.equal(request.bookingState, "Needs follow-up");
  assert.equal(request.status, "In review");
});
