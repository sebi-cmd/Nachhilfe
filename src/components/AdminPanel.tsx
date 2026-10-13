import { useState, useMemo } from 'react';
import { LogOut, Search, Trash2, Ban, CheckCircle2, Clock, Filter, Loader2 } from 'lucide-react';
import { adminAction, clearAdminToken, type Booking } from '@/lib/supabase';

type Props = {
  bookings: Booking[];
  onSignOut: () => void;
  onChanged: () => void;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5);
}

export default function AdminPanel({ bookings, onSignOut, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...bookings];
    if (filter !== 'all') {
      result = result.filter((b) => b.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.subject.toLowerCase().includes(q) ||
          b.topic.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const d = b.booking_date.localeCompare(a.booking_date);
      if (d !== 0) return d;
      return b.booking_time.localeCompare(a.booking_time);
    });
    return result;
  }, [bookings, search, filter]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed');
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    const revenue = confirmed.length * 2;
    return { total: bookings.length, confirmed: confirmed.length, cancelled: cancelled.length, revenue };
  }, [bookings]);

  const doAction = async (action: string, id: string) => {
    setLoadingId(id);
    const result = await adminAction(action, id);
    if (result.success) {
      onChanged();
    } else {
      alert(result.error ?? 'Fehler beim Ausführen der Aktion');
    }
    setLoadingId(null);
  };

  const handleCancel = (id: string) => doAction('cancel', id);
  const handleRestore = (id: string) => doAction('restore', id);

  const handleDelete = (id: string) => {
    if (!confirm('Diese Buchung wirklich endgültig löschen?')) return;
    doAction('delete', id);
  };

  const handleSignOut = () => {
    clearAdminToken();
    onSignOut();
  };

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
        <div>
          <h2 className="text-xl font-bold">Admin-Verwaltung</h2>
          <p className="mt-1 text-sm text-slate-300">
            Angemeldet als Sebastian · Klasse 1bHIF
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gesamt" value={stats.total} icon={<Clock className="h-5 w-5" />} color="slate" />
        <StatCard label="Bestätigt" value={stats.confirmed} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" />
        <StatCard label="Storniert" value={stats.cancelled} icon={<Ban className="h-5 w-5" />} color="red" />
        <StatCard label="Einnahmen" value={`${stats.revenue} €`} icon={<Filter className="h-5 w-5" />} color="amber" />
      </div>

      {/* Search and filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Suche nach Name, Fach oder Thema..."
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'confirmed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'Alle' : f === 'confirmed' ? 'Bestätigt' : 'Storniert'}
            </button>
          ))}
        </div>
      </div>

      {/* Booking table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/60">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500">Keine Buchungen gefunden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Fach</th>
                  <th className="px-4 py-3">Thema</th>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Zeit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className={`text-sm transition hover:bg-slate-50/50 ${
                      b.status === 'cancelled' ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{b.name}</td>
                    <td className="px-4 py-3 text-slate-600">{b.subject}</td>
                    <td className="px-4 py-3 text-slate-600">{b.topic}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(b.booking_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatTime(b.booking_time)}</td>
                    <td className="px-4 py-3">
                      {b.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Bestätigt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          <Ban className="h-3 w-3" />
                          Storniert
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {loadingId === b.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : b.status === 'confirmed' ? (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                          >
                            Stornieren
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(b.id)}
                            className="rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Wiederherstellen
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={loadingId === b.id}
                          className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'slate' | 'emerald' | 'red' | 'amber';
}) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <div className="rounded-xl bg-white p-5 shadow-md ring-1 ring-slate-200/60">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
