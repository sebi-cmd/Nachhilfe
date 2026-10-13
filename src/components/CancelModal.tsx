import { useState } from 'react';
import { X, Ban, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CancelModal({ open, onClose }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'notfound' | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase.rpc('cancel_booking_by_code', {
      p_cancel_code: code.trim(),
    });

    if (error) {
      setResult('notfound');
      setLoading(false);
      return;
    }

    if (data === true) {
      setResult('success');
    } else {
      setResult('notfound');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setCode('');
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {result === 'success' ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Storniert!</h2>
            <p className="mt-2 text-sm text-slate-600">
              Deine Buchung wurde erfolgreich storniert.
            </p>
            <button onClick={handleClose} className="btn-primary mt-6 w-full">
              Schließen
            </button>
          </div>
        ) : result === 'notfound' ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Nicht gefunden</h2>
            <p className="mt-2 text-sm text-slate-600">
              Der Stornocode wurde nicht gefunden oder die Buchung ist bereits
              storniert.
            </p>
            <button
              onClick={() => setResult(null)}
              className="btn-secondary mt-6 w-full"
            >
              Erneut versuchen
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <Ban className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Buchung stornieren</h2>
              <p className="mt-1 text-sm text-slate-500">
                Gib deinen Stornocode ein, den du bei der Buchung erhalten hast.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input-field font-mono text-sm"
                  placeholder="Stornocode eingeben..."
                  autoFocus
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-danger w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird storniert...
                  </>
                ) : (
                  'Stornieren'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
