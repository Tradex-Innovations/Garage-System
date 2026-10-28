# Calendar booking prototype

Run `npm run dev` in `Prototype`, then open:

- Customer website: http://127.0.0.1:3000/website/
- Admin calendar: http://127.0.0.1:3000/

Both screens use the same browser storage on the same origin. Open them in separate tabs to see updates sync. Use fictional customer details. This static prototype has no login server, database, live messaging or payment connection.

## Try the full flow

1. On the customer website, choose **Book a visit**, a service, a date and a time. Complete the details and opt into WhatsApp updates if you want to test the conversation preview.
2. Open admin. The calendar is the default screen. The new request appears in the queue and as a provisional event on its selected day.
3. Open the request and choose **Accept & book**, **Decline**, or **Suggest another time**. Suggestions appear in the WhatsApp preview and in customer tracking.
4. Use the admin conversation simulator or open **Track request** on the website with the request reference and phone number. `YES` accepts the proposed slot, `NO` asks staff to follow up, and `ANOTHER TIME` offers three available alternatives. Choosing one confirms it after checking availability again. Numbered replies also select options, common phrases such as YES PLEASE are recognised, STOP opts out, and unclear replies go to staff. A stale option triggers a fresh availability offer.
5. Open a confirmed calendar event and reschedule it. The linked customer tracking record and opted-in message preview update too.

## Scheduling rules

- All times are for `Europe/London`, including daylight saving time. A 30-minute lead time applies to website availability.
- Opening hours are Monday–Friday 09:30–18:00, Saturday 09:30–15:00, Sunday closed.
- The MOT lane and technician are reserved for MOT tests. Other visits can use either service ramp with its assigned technician.
- Pending requests and active proposals reserve their assigned resources. Declines and staff handoffs release the proposed hold. Alternative options are checked again when selected.
- Repair, wrap and branding booking requests initially reserve a consultation. Customers can also request a remote quote without a visit. The project itself needs a separate accepted quote. No project price is invented by the calendar.
- Requests, decisions and simulated messages retain a history. Staff bookings also check customer request holds.

## Live WhatsApp integration boundary

`lib/scheduling.js` contains the prototype state transitions. Its message records are previews, never provider delivery receipts. No WhatsApp API calls are made.

For a live implementation, move scheduling and conversations to an authenticated backend with database transactions, resource locking, expiring holds and idempotent event processing. Authenticate customer tracking with a secure link or OTP rather than the prototype's local reference/phone lookup. Store WhatsApp credentials only on the server.

Use the company's WhatsApp Business Platform account through Meta Cloud API or a provider. Replace the simulator with a webhook that verifies the provider signature, maps each reply to its request and proposal, deduplicates message IDs, and runs the same state transitions in a transaction. Recheck capacity before confirmation. Use interactive reply identifiers for **Yes**, **No** and **Another time**, plus a clear staff handoff.

The sending service must retain customer opt-in and enforce the messaging window. Business-initiated messages and messages outside the 24-hour customer service window require approved templates. See [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/) and Meta's [reply button message reference](https://www.postman.com/meta/whatsapp-business-platform/request/x0kd1at/send-reply-button). Delivery, failure, retry and human handoff states need actual webhook results before the UI can claim a message was delivered.

## Validation

Run `npm test` for the scheduling transitions and `npm run build -- --webpack` for all public and admin routes. Production export is written to `out/` by the existing Next.js configuration.
