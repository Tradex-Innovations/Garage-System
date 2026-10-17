import { CalendarCheck, CalendarDays, CalendarRange, Check, CheckCheck, ClipboardCheck, ClipboardList, FilePenLine, FileText, History, KeyRound, LayoutDashboard, ListFilter, LogIn, Receipt, ScanLine, Send, ShieldCheck, Wrench, X } from "lucide-react";

const ACTION_ICONS = {
  "All jobs": ListFilter,
  "In workshop": Wrench,
  "Approval needed": ClipboardCheck,
  Ready: CheckCheck,
  "All quotes": ListFilter,
  Draft: FilePenLine,
  Sent: Send,
  Accepted: Check,
  Booked: CalendarCheck,
  Declined: X,
  Day: CalendarDays,
  Week: CalendarRange,
  Overview: LayoutDashboard,
  "Work & Parts": Wrench,
  Inspection: ScanLine,
  Estimate: FileText,
  Invoice: Receipt,
  History,
  "Checked In": LogIn,
  "In Progress": Wrench,
  "Quality Check": ShieldCheck,
  Collected: KeyRound,
};

// Keep the same symbol wherever a workflow action appears.
export default function ActionIcon({ action, size = 16 }) {
  const Icon = ACTION_ICONS[action] || ClipboardList;
  return <Icon size={size} aria-hidden="true" focusable="false" />;
}
