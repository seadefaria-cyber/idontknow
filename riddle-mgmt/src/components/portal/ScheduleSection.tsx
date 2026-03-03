"use client";

import { useState, useEffect, useCallback } from "react";
import usePolling from "@/hooks/usePolling";
import SectionHeader from "./SectionHeader";

interface ScheduleEvent {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  client_name?: string;
  ai_suggested?: number;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  colorId?: string;
}

interface UnifiedEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  type: string;
  source: "portal" | "calendar";
  clientName?: string;
  aiSuggested?: boolean;
  calendarLink?: string;
  colorId?: string;
}

// Google Calendar color IDs → dark-theme-friendly colors
const GCAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "1":  { bg: "bg-[#7986cb]/20", text: "text-[#9fa8da]", border: "border-[#7986cb]/40" },   // Lavender
  "2":  { bg: "bg-[#33b679]/20", text: "text-[#66d9a0]", border: "border-[#33b679]/40" },   // Sage
  "3":  { bg: "bg-[#8e24aa]/20", text: "text-[#ce93d8]", border: "border-[#8e24aa]/40" },   // Grape
  "4":  { bg: "bg-[#e67c73]/20", text: "text-[#ef9a9a]", border: "border-[#e67c73]/40" },   // Flamingo
  "5":  { bg: "bg-[#f6bf26]/20", text: "text-[#fff176]", border: "border-[#f6bf26]/40" },   // Banana
  "6":  { bg: "bg-[#f4511e]/20", text: "text-[#ff8a65]", border: "border-[#f4511e]/40" },   // Tangerine
  "7":  { bg: "bg-[#039be5]/20", text: "text-[#4fc3f7]", border: "border-[#039be5]/40" },   // Peacock
  "8":  { bg: "bg-[#616161]/20", text: "text-[#bdbdbd]", border: "border-[#616161]/40" },   // Graphite
  "9":  { bg: "bg-[#3f51b5]/20", text: "text-[#9fa8da]", border: "border-[#3f51b5]/40" },   // Blueberry
  "10": { bg: "bg-[#0b8043]/20", text: "text-[#81c784]", border: "border-[#0b8043]/40" },   // Basil
  "11": { bg: "bg-[#d50000]/20", text: "text-[#ef5350]", border: "border-[#d50000]/40" },   // Tomato
};
const DEFAULT_GCAL_COLOR = { bg: "bg-[#4285f4]/15", text: "text-[#90caf9]", border: "border-[#4285f4]/40" };

interface ScheduleSectionProps {
  role: string;
  allUsers: { id: string; username: string; display_name: string; role: string }[];
  refreshSignal?: number;
}

const EVENT_TYPES = ["meeting", "deadline", "milestone", "session"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatTime(timeStr: string | null): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatTimeCompact(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  if (m === "00") return `${display}${ampm}`;
  return `${display}:${m}${ampm}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: { date: string; day: number; inMonth: boolean }[] = [];

  // Previous month padding
  const prevLastDay = new Date(year, month, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    const d = prevLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date: dateStr, day: d, inMonth: false });
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date: dateStr, day: d, inMonth: true });
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date: dateStr, day: d, inMonth: false });
  }

  return days;
}

function calendarEventToUnified(ev: CalendarEvent): UnifiedEvent {
  let date = "";
  let time: string | null = null;

  if (ev.start.dateTime) {
    // Parse directly from string to avoid timezone issues (Vercel SSR runs in UTC)
    // Google returns e.g. "2026-05-02T20:00:00-04:00"
    date = ev.start.dateTime.slice(0, 10);
    time = ev.start.dateTime.slice(11, 16);
  } else if (ev.start.date) {
    date = ev.start.date;
  }

  return {
    id: `cal-${ev.id}`,
    title: ev.summary || "(No title)",
    description: ev.description || null,
    date,
    time,
    location: ev.location || null,
    type: "calendar",
    source: "calendar",
    calendarLink: ev.htmlLink,
    colorId: ev.colorId,
  };
}

export default function ScheduleSection({ role, allUsers, refreshSignal }: ScheduleSectionProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarColor, setCalendarColor] = useState<{ bg: string; fg: string } | null>(null);

  const { data: portalEvents, refresh } = usePolling<ScheduleEvent[]>(
    async () => {
      const res = await fetch("/api/schedule");
      if (!res.ok) return [];
      const data = await res.json();
      return data.events;
    },
    10000
  );

  // Fetch calendar events for the visible month range
  const fetchCalendarEvents = useCallback(async () => {
    const timeMin = new Date(viewYear, viewMonth, 1).toISOString();
    const timeMax = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
    try {
      const res = await fetch(`/api/schedule/calendar?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCalendarConnected(data.connected);
      setCalendarEvents(data.events || []);
      if (data.calendarColor) setCalendarColor(data.calendarColor);
    } catch { /* ignore */ }
  }, [viewYear, viewMonth]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  // Re-fetch when refresh signal changes
  useEffect(() => {
    if (refreshSignal) {
      refresh();
      fetchCalendarEvents();
    }
  }, [refreshSignal]);

  // Build unified events
  const unified: UnifiedEvent[] = [];
  for (const ev of portalEvents || []) {
    unified.push({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      date: ev.event_date,
      time: ev.event_time,
      location: ev.location,
      type: ev.event_type,
      source: "portal",
      clientName: ev.client_name,
      aiSuggested: ev.ai_suggested === 1,
    });
  }
  for (const ev of calendarEvents) {
    unified.push(calendarEventToUnified(ev));
  }
  unified.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.time || "").localeCompare(b.time || "");
  });

  // Index events by date
  const eventsByDate = new Map<string, UnifiedEvent[]>();
  for (const ev of unified) {
    const arr = eventsByDate.get(ev.date) || [];
    arr.push(ev);
    eventsByDate.set(ev.date, arr);
  }

  const days = getMonthDays(viewYear, viewMonth);
  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) || [] : [];

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
    setSelectedDate(null);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayStr);
  }

  // Admin create event form
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !eventDate) return;
    if (role === "admin" && !clientId) return;
    setSaving(true);
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || null, eventType, eventDate, eventTime: eventTime || null, location: location || null, clientId: role === "admin" ? clientId : undefined }),
    });
    if (res.ok) {
      setTitle(""); setDescription(""); setEventType("meeting"); setEventDate(""); setEventTime(""); setLocation(""); setClientId("");
      setShowCreate(false);
      refresh();
      fetchCalendarEvents();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="animate-section-enter">
      <SectionHeader title="Schedule" />

      {/* Up Next — top 3 upcoming events */}
      {(() => {
        const upcoming = unified.filter((ev) => ev.date >= todayStr).slice(0, 3);
        if (upcoming.length === 0) return null;
        return (
          <div className="mb-6 space-y-2">
            <p className="text-[10px] tracking-[0.2em] uppercase text-gray-300 mb-3">Up Next</p>
            {upcoming.map((ev, i) => {
              const hasEventColor = ev.source === "calendar" && ev.colorId && GCAL_COLORS[ev.colorId];
              const evColor = hasEventColor ? GCAL_COLORS[ev.colorId!] : null;
              const calHex = calendarColor?.bg || "#4285f4";
              const accentColor = evColor
                ? evColor.text.replace("text-", "").replace(/[\[\]]/g, "")
                : ev.source === "calendar" ? calHex
                : ev.type === "meeting" ? "#60a5fa"
                : ev.type === "deadline" ? "#f87171"
                : ev.type === "session" ? "#4ade80"
                : "#c084fc";

              return (
                <div
                  key={ev.id}
                  className="glass-elevated rounded-lg p-4 pl-5 border-l-2 animate-fade-in"
                  style={{ borderLeftColor: `${accentColor}99`, animationDelay: `${i * 0.05}s`, opacity: 0 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 font-light truncate">{ev.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(ev.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        {ev.time && <span className="text-[10px] text-gray-400">{formatTime(ev.time)}</span>}
                        {ev.location && <span className="text-[10px] text-gray-300 truncate">{ev.location}</span>}
                      </div>
                    </div>
                    {ev.source === "calendar" && ev.calendarLink && (
                      <a href={ev.calendarLink} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>

        <div className="flex items-center gap-4">
          <h2 className="text-lg font-light text-gray-700 tracking-wide">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) && (
            <button onClick={goToday} className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-gray-300">
              Today
            </button>
          )}
        </div>

        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS.map((d) => (
            <div key={d} className="py-2.5 text-center text-[10px] tracking-[0.2em] text-gray-300 font-medium">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = eventsByDate.get(day.date) || [];
            const isToday = day.date === todayStr;
            const isSelected = day.date === selectedDate;
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(isSelected ? null : day.date)}
                className={`
                  relative min-h-[72px] p-1.5 border-b border-r border-gray-100 text-left transition-all duration-150 overflow-hidden
                  ${day.inMonth ? "" : "opacity-25"}
                  ${isSelected ? "bg-gray-100" : hasEvents ? "hover:bg-gray-50" : "hover:bg-gray-50/50"}
                  ${i % 7 === 6 ? "border-r-0" : ""}
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-6 h-6 text-xs rounded-full transition-all
                    ${isToday ? "bg-gray-900 text-white font-medium" : "text-gray-500 font-light"}
                    ${isSelected && !isToday ? "ring-1 ring-gray-300" : ""}
                  `}
                >
                  {day.day}
                </span>

                {/* Event indicators — dot + title, click day for full details */}
                {dayEvents.length > 0 && (
                  <div className="mt-0.5 space-y-[2px]">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const hasEventColor = ev.source === "calendar" && ev.colorId && GCAL_COLORS[ev.colorId];
                      const gcColor = hasEventColor ? GCAL_COLORS[ev.colorId!] : null;
                      const calHex = calendarColor?.bg || "#4285f4";

                      const dotColor = gcColor
                        ? gcColor.text.replace("text-", "").replace(/[\[\]]/g, "")
                        : ev.source === "calendar"
                          ? calHex
                          : ev.source === "portal"
                            ? ev.type === "meeting" ? "#60a5fa"
                              : ev.type === "deadline" ? "#f87171"
                              : ev.type === "session" ? "#4ade80"
                              : "#c084fc"
                            : "#60a5fa";

                      return (
                        <div key={ev.id} className="flex items-center gap-[2px] text-[7px] leading-tight min-w-0">
                          <span className="shrink-0 w-[4px] h-[4px] rounded-full" style={{ backgroundColor: dotColor }} />
                          <span className="truncate text-gray-500">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[8px] text-gray-400 pl-2">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDate && (
        <div className="mt-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs tracking-[0.15em] uppercase text-gray-400">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {role === "admin" && (
              <button
                onClick={() => { setEventDate(selectedDate); setShowCreate(!showCreate); }}
                className="text-[10px] tracking-[0.15em] uppercase text-gray-400 hover:text-gray-500 transition-colors flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add
              </button>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <div className="glass rounded-lg p-6 text-center">
              <p className="text-sm text-gray-400 font-light">No events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => {
                const evColorEntry = ev.colorId && GCAL_COLORS[ev.colorId] ? GCAL_COLORS[ev.colorId] : null;
                const borderClass = ev.source === "portal"
                  ? ev.type === "meeting" ? "border-blue-500/40"
                    : ev.type === "deadline" ? "border-red-500/40"
                    : ev.type === "session" ? "border-green-500/40"
                    : "border-purple-500/40"
                  : evColorEntry ? evColorEntry.border : "";
                const borderStyle = ev.source === "calendar" && !evColorEntry
                  ? { borderLeftColor: `${calendarColor?.bg || "#4285f4"}99` } : undefined;
                return (
                <div
                  key={ev.id}
                  className={`glass-elevated rounded-lg p-4 pl-5 transition-all duration-200 animate-fade-in border-l-2 ${borderClass}`}
                  style={{ animationDelay: `${i * 0.04}s`, opacity: 0, ...borderStyle }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {ev.time && <span className="text-xs text-gray-400 font-mono">{formatTime(ev.time)}</span>}
                        <p className="text-sm text-gray-700 font-light">{ev.title}</p>
                      </div>
                      {ev.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        {ev.location && <span className="text-[10px] text-gray-300">{ev.location}</span>}
                        {ev.source === "portal" && <span className="text-[10px] text-gray-200 uppercase tracking-wider">{ev.type}</span>}
                        {ev.aiSuggested && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-500 tracking-wider uppercase">AI</span>
                        )}
                        {role === "admin" && ev.clientName && <span className="text-[10px] text-gray-300">{ev.clientName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ev.source === "calendar" && ev.calendarLink && (
                        <a href={ev.calendarLink} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500 transition-colors" title="View details">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                      {role === "admin" && ev.source === "portal" && (
                        <button onClick={() => handleDelete(ev.id)} className="text-gray-200 hover:text-red-500 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ); })}
            </div>
          )}
        </div>
      )}

      {/* Admin create event form */}
      {showCreate && role === "admin" && (
        <form onSubmit={handleCreate} className="glass rounded-lg p-6 mt-4 space-y-4 animate-fade-in">
          <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">New Event</p>
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Title</label>
            <input type="text" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Type</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900">
                {EVENT_TYPES.map((t) => <option key={t} value={t} className="bg-white">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Client</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light bg-white border border-gray-200 text-gray-900">
                <option value="" className="bg-white">Select client...</option>
                {allUsers.filter((u) => u.role !== "admin").map((u) => (
                  <option key={u.id} value={u.id} className="bg-white">{u.display_name || u.username}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className="w-full px-4 py-3 rounded-lg text-sm font-light" />
            </div>
            <div>
              <label className="text-xs text-gray-400 tracking-wide block mb-2">Time (optional)</label>
              <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Location (optional)</label>
            <input type="text" placeholder="e.g. Zoom, Studio A" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-3 rounded-lg text-sm font-light" />
          </div>
          <div>
            <label className="text-xs text-gray-400 tracking-wide block mb-2">Description (optional)</label>
            <textarea placeholder="Details..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-lg text-sm font-light resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-lg text-xs tracking-[0.2em] uppercase bg-gray-900 text-white hover:bg-gray-800 transition-all font-medium disabled:opacity-30">
              {saving ? "Creating..." : "Create Event"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-3 rounded-lg text-xs tracking-[0.2em] uppercase text-gray-400 hover:text-gray-500 border border-gray-200 hover:border-gray-300 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Not connected hint */}
      {!calendarConnected && (
        <p className="text-center text-[10px] text-gray-300 mt-4">Connect your calendar in Settings to sync events</p>
      )}
    </div>
  );
}
