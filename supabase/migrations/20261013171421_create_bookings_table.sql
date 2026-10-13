/*
# Nachhilfe-Buchungssystem für Sebastian (1bHIF)

## Überblick
Erstellt ein Buchungssystem für Nachhilfestunden. Jeder kann eine Buchung aufgeben
und den öffentlichen Kalender einsehen. Nur der Admin (Sebastian) kann nach Login
alle Buchungen verwalten. Buchende können ihre eigene Buchung über einen Stornocode
stornieren.

## Neue Tabellen
- `bookings`: Speichert alle Nachhilfe-Buchungen
  - `id` (uuid, Primärschlüssel)
  - `name` (text, Name der buchenden Person)
  - `subject` (text, Fach z.B. Mathematik)
  - `topic` (text, Konkretes Thema)
  - `booking_date` (date, Datum der Stunde)
  - `booking_time` (time, Uhrzeit der Stunde)
  - `status` (text, 'confirmed' oder 'cancelled', Standard 'confirmed')
  - `cancel_code` (text, eindeutiger Stornocode für die buchende Person)
  - `notes` (text, optionale Notizen)
  - `created_at` (timestamptz, Erstellungszeitpunkt)

## Funktionen
- `cancel_booking_by_code(p_cancel_code text)`: SECURITY DEFINER Funktion,
  die eine Buchung anhand des Stornocodes auf 'cancelled' setzt. Erlaubt
  nicht-eingeloggten Personen, ihre eigene Buchung zu stornieren.

## Sicherheit (RLS)
- SELECT: Öffentlich für alle (anon + authenticated) — Kalender ist sichtbar für alle
- INSERT: Öffentlich für alle (anon + authenticated) — Jeder kann buchen
- UPDATE: Nur für authenticated (Admin) — Nur Sebastian kann ändern
- DELETE: Nur für authenticated (Admin) — Nur Sebastian kann löschen
- Die cancel_booking_by_code Funktion läuft als SECURITY DEFINER und umgeht RLS
  für die Stornierung durch die buchende Person

## Wichtige Hinweise
1. Der Stornocode wird automatisch bei der Buchung generiert
2. Die Status-Spalte unterscheidet zwischen bestätigt und storniert
3. Stornierte Buchungen bleiben in der Datenbank (kein hartes Löschen durch Buchende)
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  cancel_code text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_bookings" ON bookings;
CREATE POLICY "public_select_bookings"
ON bookings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_bookings" ON bookings;
CREATE POLICY "public_insert_bookings"
ON bookings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_bookings" ON bookings;
CREATE POLICY "admin_update_bookings"
ON bookings FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_bookings" ON bookings;
CREATE POLICY "admin_delete_bookings"
ON bookings FOR DELETE
TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Funktion zum Stornieren einer Buchung per Code
CREATE OR REPLACE FUNCTION cancel_booking_by_code(p_cancel_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bookings SET status = 'cancelled'
  WHERE cancel_code = p_cancel_code AND status = 'confirmed';
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_booking_by_code(text) TO anon, authenticated;
