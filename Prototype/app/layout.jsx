import "./globals.css";

export const metadata = {
  title: "DC Motors — Admin Demo",
  description: "DC Motors admin prototype: customer requests, repair and wrap quotes, bookings, jobs and invoices."
};

export default function RootLayout({ children }) {
  return <html lang="en-GB"><body>{children}</body></html>;
}
