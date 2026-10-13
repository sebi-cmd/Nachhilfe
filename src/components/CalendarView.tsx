import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, BookOpen, XCircle } from 'lucide-react';
import type { Booking } from '@/lib/supabase';

type Props = {
  bookings: Booking[];
  isAdmin: boolean;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
};

const MONTHS = [
  'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('de-AT', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

export default function CalendarView({ bookings, isAdmin, onDelete, onCancel }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed'),
    [bookings]
  );

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of activeBookings) {
      if (!map[b.booking_date]) map[b.booking_date] = [];
      map[b.booking_date].push(b);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.booking_time.localeCompare(b.booking_time));
    }
    return map;
  }, [activeBookings]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [currentMonth, currentYear]);

  const dateStr = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedBookings = selectedDate
    ? bookingsByDate[selectedDate] || []
    : [];
  const allBookingsSorted = useMemo(
    () => [...activeBookings].sort((a, b) => {
      const d = a.booking_date.localeCompare(b.booking_date);
      if (d !== 0) return d;
      return a.booking_time.localeCompare(b.booking_time);
    }),
    [activeBookings]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60">
        {/* Calendar header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={prevMonth}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold uppercase text-slate-400">
              {d}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={i} className="aspect-square" />;
            }
            const ds = dateStr(day);
            const dayBookings = bookingsByDate[ds] || [];
            const hasBookings = dayBookings.length > 0;
            const isToday = ds === todayStr;
            const isSelected = ds === selectedDate;

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : isToday
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : hasBookings
                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className={`font-medium ${isSelected ? 'text-white' : ''}`}>
                  {day}
                </span>
                {hasBookings && (
                  <span
                    className={`mt-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-bold ${
                      isSelected
                        ? 'bg-white text-emerald-600'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {dayBookings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day bookings */}
      {selectedDate && (
        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60 animate-fade-in">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            {formatDate(selectedDate)}
          </h3>
          {selectedBookings.length === 0 ? (
            <p className="text-sm text-slate-500">Keine Buchungen an diesem Tag.</p>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  showAdmin={isAdmin}
                  onDelete={onDelete}
                  onCancel={onCancel}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All upcoming bookings list */}
      <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
          <Clock className="h-5 w-5 text-emerald-600" />
          Alle bevorstehenden Stunden
        </h3>
        {allBookingsSorted.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-4 py-8 text-center">
            <p className="text-sm text-slate-500">
              Noch keine Buchungen vorhanden. Sei der Erste, der eine Stunde bucht!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allBookingsSorted.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                showDate
                showAdmin={isAdmin}
                onDelete={onDelete}
                onCancel={onCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  showDate,
  showAdmin,
  onDelete,
  onCancel,
}: {
  booking: Booking;
  showDate?: boolean;
  showAdmin?: boolean;
  onDelete?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 transition ${
        booking.status === 'cancelled'
          ? 'border-red-200 bg-red-50/50'
          : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
        <Clock className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-[200px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">
            {booking.subject}
          </span>
          {showDate && (
            <span className="text-sm text-slate-500">
              · {formatDate(booking.booking_date)}
            </span>
          )}
          <span className="text-sm text-slate-500">
            · {formatTime(booking.booking_time)} Uhr
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            {booking.topic}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            {booking.name}
          </span>
        </div>
        {booking.notes && (
          <p className="mt-1 text-sm text-slate-500 italic">"{booking.notes}"</p>
        )}
      </div>

      {booking.status === 'cancelled' && (
        <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
          <XCircle className="h-3 w-3" />
          Storniert
        </span>
      )}

      {showAdmin && booking.status === 'confirmed' && (
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
            >
              Stornieren
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(booking.id)}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
            >
              Löschen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
