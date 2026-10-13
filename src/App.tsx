import { useState, useEffect, useCallback } from 'react';
import { GraduationCap, LogIn, Ban, ShieldCheck, CalendarDays, BookOpen } from 'lucide-react';
import { supabase, getAdminToken, clearAdminToken, type Booking } from '@/lib/supabase';
import LoginModal from '@/components/LoginModal';
import BookingForm from '@/components/BookingForm';
import CalendarView from '@/components/CalendarView';
import CancelModal from '@/components/CancelModal';
import AdminPanel from '@/components/AdminPanel';

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: true });

    if (!error && data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();
    setIsAdmin(!!getAdminToken());
  }, [fetchBookings]);

  const handleSignOut = () => {
    clearAdminToken();
    setIsAdmin(false);
  };

  const handleLoginSuccess = () => {
    setIsAdmin(true);
    fetchBookings();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-slate-900">
                Nachhilfe Sebastian
              </h1>
              <p className="text-xs text-slate-500">Klasse 1bHIF · 2 € / Stunde</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCancelOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">Stornieren</span>
            </button>
            {isAdmin ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                title="Admin-Anmeldung"
              >
                <LogIn className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Hero section */}
        {!isAdmin && (
          <section className="mb-8 text-center sm:mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
              <BookOpen className="h-4 w-4" />
              Nachhilfe für die 1bHIF
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Buche deine Nachhilfestunde
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Einfach Formular ausfüllen, Termin aussuchen und los geht's.
              Der Kalender zeigt alle gebuchten Stunden — damit weißt du,
              wann Sebastian Zeit hat.
            </p>
          </section>
        )}

        {isAdmin ? (
          <AdminPanel
            bookings={bookings}
            onSignOut={handleSignOut}
            onChanged={fetchBookings}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Booking form */}
            <div className="lg:col-span-2">
              <BookingForm onBookingCreated={fetchBookings} />
            </div>

            {/* Calendar and list */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/60">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-600" />
                    <p className="text-sm text-slate-500">Laden...</p>
                  </div>
                </div>
              ) : (
                <CalendarView
                  bookings={bookings}
                  isAdmin={false}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white/50 py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500 sm:px-6">
          <p>
            Nachhilfe Sebastian · Klasse 1bHIF ·{' '}
            <CalendarDays className="ml-1 inline h-3.5 w-3.5" />
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />
      <CancelModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  );
}
