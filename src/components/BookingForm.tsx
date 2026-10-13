import { useState } from 'react';
import { Calendar, Clock, BookOpen, User, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase, type BookingInput } from '@/lib/supabase';

const SUBJECTS = [
  'Mathematik',
  'Programmieren',
  'Datenbanken',
  'Netzwerktechnik',
  'Softwareentwicklung',
  'Betriebssysteme',
  'Englisch',
  'Deutsch',
  ' sonstiges Fach',
];

type Props = {
  onBookingCreated: () => void;
};

export default function BookingForm({ onBookingCreated }: Props) {
  const [form, setForm] = useState<BookingInput>({
    name: '',
    subject: '',
    topic: '',
    booking_date: '',
    booking_time: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ cancelCode: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: insertError } = await supabase
      .from('bookings')
      .insert({
        name: form.name.trim(),
        subject: form.subject.trim(),
        topic: form.topic.trim(),
        booking_date: form.booking_date,
        booking_time: form.booking_time,
        notes: form.notes?.trim() || null,
      })
      .select('cancel_code')
      .single();

    if (insertError || !data) {
      setError('Beim Buchen ist ein Fehler aufgetreten. Bitte versuche es erneut.');
      setLoading(false);
      return;
    }

    setSuccess({ cancelCode: data.cancel_code });
    setLoading(false);
    setForm({ name: '', subject: '', topic: '', booking_date: '', booking_time: '', notes: '' });
    onBookingCreated();
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-slate-200/60 animate-scale-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Buchung erfolgreich!</h3>
          <p className="mt-2 text-sm text-slate-600">
            Deine Nachhilfestunde wurde gebucht. Bitte notiere dir deinen
            Stornocode für eine spätere Stornierung:
          </p>
          <div className="mx-auto mt-4 max-w-xs rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Stornocode
            </p>
            <p className="mt-1 break-all font-mono text-sm font-bold text-slate-900">
              {success.cancelCode}
            </p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="btn-primary mt-6"
          >
            Weitere Buchung
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200/60 sm:p-8">
      <h2 className="text-xl font-bold text-slate-900">Nachhilfe buchen</h2>
      <p className="mt-1 text-sm text-slate-500">
        Fülle das Formular aus, um eine Stunde bei Sebastian zu reservieren.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Dein Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field pl-10"
              placeholder="z.B. Max Mustermann"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Fach
          </label>
          <div className="relative">
            <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="input-field pl-10"
              required
            >
              <option value="">Fach auswählen...</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Thema
          </label>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="input-field pl-10"
              placeholder="z.B. Ableitungen, Schleifen, SQL-Joins..."
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Datum
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
              <input
                type="date"
                min={today}
                value={form.booking_date}
                onChange={(e) => setForm({ ...form, booking_date: e.target.value })}
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Uhrzeit
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
              <input
                type="time"
                value={form.booking_time}
                onChange={(e) => setForm({ ...form, booking_time: e.target.value })}
                className="input-field pl-10"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Notizen <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input-field min-h-[80px] resize-y"
            placeholder="Zusätzliche Informationen für Sebastian..."
            rows={3}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
          <span className="text-sm text-emerald-700">Kosten pro Stunde:</span>
          <span className="text-lg font-bold text-emerald-700">2 €</span>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird gebucht...
            </>
          ) : (
            'Stunde buchen'
          )}
        </button>
      </form>
    </div>
  );
}
