# DC Motors website and admin prototype

A simple Next.js frontend for demonstrating DC Motors' staff workflow. It includes the business's logo and blue colour direction, service categories and published opening hours. All records, messages, approvals, inspection illustrations and payments are demo data or simulated actions.

## Run locally

Requires Node.js 20.9 or newer and npm.

```sh
npm install
npm run dev
```

Open the Local URL printed by Next.js. `npm run build` generates a static website in `out/`.

## Admin screens

- Dashboard with jobs, approvals, ready vehicles, unpaid invoices and new enquiries.
- Requests inbox for MOT/service bookings, repair estimates, wrapping/PPF/fleet-branding enquiries and callbacks.
- Day/week diary, including Saturday, with bay/technician conflicts and opening-hour checks.
- Customers and vehicle history, with a clearly labelled sample MOT lookup.
- Quotes with custom scope/pricing, simulated sending, staff-recorded acceptance/decline and conversion to a confirmed appointment.
- Job workspace with notes, tasks, parts availability, inspection findings, staff-recorded repair approvals, invoices, payments and history.
- Invoices with partial/full simulated payments and balance updates.

The public website prototype is available at `/website/`. Customer approvals are still recorded by staff; request tracking is a local demonstration, not an authenticated production portal. New enquiries do not reserve a bay until staff confirm an appointment.

## Suggested demonstration

1. Open **Requests**, then **REQ-2002**, the vehicle-wrapping enquiry.
2. Click **Prepare quotation**. Enter the scope and a demo price, then **Send quote (demo)**.
3. Click **Record accepted**, then **Book approved quote**. Pick an available weekday time.
4. The enquiry becomes Confirmed, the quotation becomes Booked, and one linked appointment appears in Diary.
5. Open that appointment from the diary, check in the vehicle and start the work.
6. Complete the approved tasks in **Work & Parts**, then move the job through **Quality Check** and **Ready**.
7. Issue the invoice, record a simulated payment and mark the vehicle **Collected**.

For the repair-approval example, **Try the sample job** opens job #1042. In **Estimate**, staff can record approval or decline of the recommended brake repair.

For MOT booking, **REQ-2001** includes a requested MOT preparation check. Confirm it on an available Saturday slot before 15:00. Sundays are closed; weekday hours are 09:30–18:00 and Saturday hours are 09:30–15:00. Bank-holiday exceptions are not modelled.

## Storage and scope

Changes persist in this browser/origin. Previous v1 demo jobs are migrated while preserving work, payments and history; sample dates move to the new demo day. A reset restores fictional jobs, requests and quotes. Different browsers and origins have independent data.

There is no backend, production sign-in, production website-form ingestion, messaging, official MOT lookup, payment processor or production accounting. Incoming requests can be recorded manually or submitted from the public website demo on the same browser and origin. Prices are illustrative totals; no production tax calculation is included. Used-car inventory remains on the client’s existing sales website, linked from the public prototype. The diary uses one technician and bay per visit and one continuous block for wrapping/PPF work; multi-operation and multi-day planning can be added later.

## Source files

- `app/page.jsx`: core admin screens and job workspace.
- `components/AdminFeatures.jsx`: enquiries, quotes and sample MOT lookup.
- `lib/demo.js`: sample jobs, totals and scheduling rules.
- `lib/business.js`: request/quotation state transitions and booking conversion.
- `app/globals.css`: responsive styling.
- `public/dc-motors-logo.png`: logo from the supplied DC Motors website, used for this private demo.

Dependencies: Next.js, React and Lucide icons. The optional Roboto font falls back to system fonts when unavailable.

## Public website prototype

Open http://127.0.0.1:3000/website/ while the development server is running. The existing admin is at `/`.

- Animated service cards link to six static service pages under `/website/services/`.
- Two-step booking and quotation forms validate vehicle/contact details, reject past dates and Sundays, and save to the existing local Requests inbox. Dates are requests, not confirmed appointments.
- Quote reference photos accept up to three JPG/PNG/WebP files of 5 MB each. Only filenames are saved; no files are uploaded.
- Track request matches a local reference and phone number. This is a demo convenience, not authentication or a production data-security boundary.
- SMS-update preferences are recorded only; no SMS/email messages are sent.
- MOT checker links to GOV.UK rather than fabricating results. Invoices, car sales, WhatsApp, maps and telephone actions link to the existing external services.
- Interactive finish comparison, colour swatches, FAQs, responsive navigation and mobile contact actions. Animation respects reduced motion.
- Stock photography and colour treatments are illustrative. No fabricated reviews, ratings or completed-project claims are used. Asset sources are in `public/website/ASSETS.md`.

Website sources: `app/website/CustomerWebsite.jsx`, `website.css`, `services.js`, and `services/[slug]/page.jsx`. The website layout has its own metadata and noindex setting for the prototype.
