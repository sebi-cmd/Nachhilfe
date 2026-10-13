/*
# Lock down UPDATE/DELETE on bookings

## Problem
Die bisherigen UPDATE und DELETE Policies erlauben jedem "authenticated" Nutzer,
alle Buchungen zu ändern oder zu löschen. Das ist ein Sicherheitsrisiko.

## Lösung
Da Admin-Aktionen über die Edge-Function mit dem Service Role Key laufen
(der RLS umgeht), brauchen wir keine öffentlichen UPDATE/DELETE Policies.
Wir entfernen die bestehenden Policies und ersetzen sie durch restriktive,
die nur über den Service Role Key (der RLS bypassed) ausgeführt werden können.

## Sicherheit
- SELECT: weiterhin öffentlich für alle (Kalender sichtbar)
- INSERT: weiterhin öffentlich für alle (jeder kann buchen)
- UPDATE: keine Policy mehr für anon/authenticated (nur Service Role Key kann ändern)
- DELETE: keine Policy mehr für anon/authenticated (nur Service Role Key kann löschen)
*/

DROP POLICY IF EXISTS "admin_update_bookings" ON bookings;
DROP POLICY IF EXISTS "admin_delete_bookings" ON bookings;
