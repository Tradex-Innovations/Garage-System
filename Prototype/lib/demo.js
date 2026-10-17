export const DEMO_DATE = "2026-10-15";
export const STORAGE_KEY = "bayline-workshop-demo-v1";
export const STAGES = ["Booked", "Checked In", "In Progress", "Quality Check", "Ready", "Collected"];
export const TECHNICIANS = ["Alex Morgan", "Sam Taylor", "Chris Evans"];
export const BAYS = ["Ramp 1", "Ramp 2", "MOT lane"];
export const SERVICES = {
  "MOT & full service": { price: 213.85, duration: 90 },
  "MOT test": { price: 54.85, duration: 60 },
  "Interim service": { price: 99, duration: 60 },
  "Full service": { price: 159, duration: 90 },
  "Parts replacement": { price: 75, duration: 60 },
  "Other": { price: 85, duration: 60 },
  "Diagnostics": { price: 85, duration: 60 },
  "Brake repair": { price: 175, duration: 90 },
  "Vehicle wrapping": { price: null, duration: 120, quoteOnly: true },
  "PPF protection": { price: null, duration: 120, quoteOnly: true },
  "Fleet branding": { price: null, duration: 120, quoteOnly: true },
};
const customers = [
  ["Sarah Mitchell", "Ford Fiesta", "LK19 FWD", "48,210", "SM"],
  ["Ben Carter", "Volkswagen Golf", "BT21 VGL", "32,450", "BC"],
  ["Olivia Wilson", "Toyota Yaris", "OV18 TYR", "61,320", "OW"],
  ["James Walker", "BMW 320d", "JW20 BMW", "42,680", "JW"],
  ["Amelia Brown", "Audi A3", "AB22 AUD", "21,905", "AB"],
  ["Noah Harris", "Vauxhall Corsa", "NH17 VXC", "73,100", "NH"],
  ["Ella Thompson", "MINI Cooper", "ET19 MNC", "39,840", "ET"],
  ["Liam Robinson", "Ford Transit", "LR21 FTR", "58,725", "LR"],
];
export const SAMPLE_CUSTOMERS = customers.map(([name, vehicle, reg, mileage, initials], i) => ({
  id: i + 1, name, vehicle, reg, mileage, initials,
  email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
  phone: `07700 900${String(i + 10).padStart(3, "0")}`,
  motDue: "2026-11-02", serviceDue: "2027-04-14",
}));
export const money = value => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
export const dateLabel = date => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
export const minutes = time => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
export const timeLabel = value => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
export const authorisedTotal = job => Math.round(job.items.filter(item => item.approval === "approved").reduce((sum, item) => sum + item.price, 0) * 100) / 100;
export const estimateTotal = job => Math.round(job.items.filter(item => item.approval !== "declined").reduce((sum, item) => sum + item.price, 0) * 100) / 100;
export const paidTotal = job => Math.round(job.payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
export const balance = job => Math.max(0, Math.round((authorisedTotal(job) - paidTotal(job)) * 100) / 100);
export const pendingApproval = job => job.estimateSent && job.items.some(item => item.approval === "pending");
export function openingHours(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (!Number.isFinite(day) || day === 0) return null;
  return { start: 570, end: day === 6 ? 900 : 1080 };
}
export function findConflict(jobs, booking, excludeId) {
  const start = minutes(booking.time), end = start + Number(booking.duration);
  const hours = openingHours(booking.date);
  if (!hours) return "The workshop is closed on Sundays. Choose a Monday–Saturday date.";
  if (!Number.isFinite(start) || !Number.isFinite(end) || Number(booking.duration) <= 0) return "Choose a valid start time and duration.";
  if (start < hours.start || end > hours.end) return `Choose a time within DC Motors’ opening hours, ${timeLabel(hours.start)}–${timeLabel(hours.end)}.`;
  if (booking.service === "MOT test" && booking.bay !== "MOT lane") return "Choose the MOT lane for an MOT test.";
  const match = jobs.find(job => job.id !== excludeId && job.date === booking.date && job.status !== "Collected" &&
    (job.bay === booking.bay || job.technician === booking.technician) &&
    start < minutes(job.time) + job.duration && end > minutes(job.time));
  return match ? `${match.bay === booking.bay ? booking.bay : booking.technician} is already booked ${match.time}–${timeLabel(minutes(match.time) + match.duration)} for ${match.customer.reg}. Choose another time or resource.` : "";
}
export function createJob(id, customer, booking) {
  const price = SERVICES[booking.service]?.quoteOnly ? Number(booking.quotePrice) : SERVICES[booking.service]?.price;
  if (!Number.isFinite(price) || price <= 0) throw new Error("An agreed positive price is required before booking this work.");
  return { id, customer, date: booking.date, time: booking.time, duration: Number(booking.duration), bay: booking.bay,
    technician: booking.technician, service: booking.service, status: "Booked", waitingParts: false, motPrep: booking.motPrep || "No", requestId: booking.requestId || null, quoteId: booking.quoteId || null,
    items: [{ id: `${id}-base`, description: booking.scope || booking.service, price, type: SERVICES[booking.service]?.quoteOnly ? "Quoted project" : "Service", approval: "approved", complete: false }],
    findings: [], notes: booking.notes ? [booking.notes] : [], estimateSent: false, invoiceIssued: false, payments: [],
    history: [`Booking created for ${dateLabel(booking.date)} at ${booking.time}.`],
  };
}
export function seedJobs() {
  const settings = [
    ["09:30", "Ramp 1", "Alex Morgan", "MOT & full service", "In Progress"],
    ["10:30", "MOT lane", "Sam Taylor", "MOT test", "Booked"],
    ["10:00", "Ramp 2", "Chris Evans", "Full service", "Checked In"],
    ["11:30", "Ramp 2", "Chris Evans", "Diagnostics", "Quality Check"],
    ["13:00", "MOT lane", "Sam Taylor", "MOT test", "Ready"],
    ["11:00", "Ramp 1", "Alex Morgan", "Brake repair", "In Progress"],
    ["14:00", "Ramp 2", "Chris Evans", "Full service", "Ready"],
    ["09:30", "MOT lane", "Sam Taylor", "MOT test", "Collected"],
  ];
  return settings.map(([time, bay, technician, service, status], i) => {
    const job = createJob(1042 + i, SAMPLE_CUSTOMERS[i], { date: DEMO_DATE, time, bay, technician, service, duration: SERVICES[service].duration });
    job.status = status;
    if (i === 0) {
      job.findings = [{ id: "brakes", title: "Front brake pads worn", severity: "Attention", detail: "Front pads measured at 2 mm. Recommend replacing the front pads.", priced: true }];
      job.items.push({ id: "1042-brakes", description: "Replace front brake pads — parts & labour", price: 175, type: "Repair", approval: "pending", complete: false });
      job.estimateSent = true;
      job.notes = ["Customer reports a squeaking noise when braking."];
      job.history.unshift("Vehicle checked in. Inspection added. Repair estimate sent (simulated).");
    }
    if ([3, 4, 6, 7].includes(i)) job.items = job.items.map(item => ({ ...item, complete: true }));
    if ([4, 6, 7].includes(i)) job.invoiceIssued = true;
    if ([6, 7].includes(i)) job.payments = [{ amount: authorisedTotal(job), method: "Card", label: "Sample payment" }];
    if (i === 4) job.payments = [{ amount: 20, method: "Card", label: "Sample deposit" }];
    if (i === 5) job.waitingParts = true;
    return job;
  });
}
