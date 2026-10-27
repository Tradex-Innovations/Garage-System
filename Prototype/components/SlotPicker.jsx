"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { availableSlots, workshopDate } from "../lib/scheduling";

const monthTitle = month => new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const isoDate = (year, month, day) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export default function SlotPicker({ workspace, service, selected, onChange, excludeRequestId, id = "slot-picker" }) {
  const today = workshopDate();
  const [month, setMonth] = useState((selected?.date || today).slice(0, 7));
  const [day, setDay] = useState(selected?.date || today);
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const days = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, i) => i - firstWeekday + 1);
  const options = { excludeRequestId };
  const slotsFor = date => availableSlots(workspace, date, service, options);
  const slots = slotsFor(day);
  const moveMonth = amount => {
    const d = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
    const next = isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, 1).slice(0, 7);
    setMonth(next);
    setDay(next < today.slice(0, 7) ? today : `${next}-01`);
    onChange(null);
  };
  return <div className="slot-picker" id={id}>
    <div className="slot-picker-head"><span><CalendarDays size={18} />Choose a visit date</span><div><button type="button" aria-label="Previous month" disabled={month <= today.slice(0, 7)} onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button><strong>{monthTitle(month)}</strong><button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button></div></div>
    <div className="slot-picker-grid" role="group" aria-label="Available booking dates">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(label => <span className="slot-weekday" key={label}>{label}</span>)}
      {days.map((number, index) => {
        if (number < 1 || number > daysInMonth) return <span aria-hidden="true" key={`blank-${index}`} />;
        const date = isoDate(year, monthNumber, number);
        const count = slotsFor(date).length;
        return <button type="button" key={date} className={`slot-day ${day === date ? "selected" : ""}`} disabled={!count} aria-pressed={day === date} aria-label={`${date}, ${count} available ${count === 1 ? "time" : "times"}`} onClick={() => { setDay(date); onChange(null); }}><b>{number}</b>{count > 0 && <i />}</button>;
      })}
    </div>
    <div className="slot-picker-times"><h4><Clock3 size={16} />{day === today ? "Today" : new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</h4>{slots.length ? <div role="group" aria-label="Available times">{slots.map(slot => <button type="button" key={`${slot.date}-${slot.time}`} className={selected?.date === slot.date && selected?.time === slot.time ? "selected" : ""} aria-pressed={selected?.date === slot.date && selected?.time === slot.time} onClick={() => onChange(slot)}>{slot.time}</button>)}</div> : <p>No available times on this day. Choose another date.</p>}</div>
    {selected && <p className="slot-picker-selected"><CalendarDays size={15} />Selected: {new Date(`${selected.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })} at {selected.time}</p>}
  </div>;
}
