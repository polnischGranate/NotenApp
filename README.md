# NotenRechner

Statisches, schnelles MVP für Schüler in Deutschland. HTML, CSS und Vanilla JavaScript – ohne Frameworks und ohne serverseitige Notenverarbeitung.

## Funktionen

- Gewichteter Notendurchschnitt
- Einfacher Notendurchschnitt
- Fächer hinzufügen, bearbeiten und löschen
- Zielnoten-Rechner
- Dezimalnoten mit Punkt oder Komma
- Optionales localStorage
- „Alle Daten löschen“
- Dark Mode
- Responsive Mobile-first Oberfläche
- SEO-Metadaten
- Impressum-, Datenschutz- und Kontakt-Platzhalter
- Werbeplatzhalter ohne Werbeskript oder Tracking

## Lokal starten

Ein einfacher statischer Server reicht, z. B. mit Python:

```bash
python3 -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

## Veröffentlichung

Der Ordner kann auf einen beliebigen statischen Webhost hochgeladen werden. Für eine kostenlose Variante eignet sich z. B. GitHub Pages. Vor der Veröffentlichung `sitemap.xml` und die Canonical-/Open-Graph-URL in `index.html` auf die echte Domain anpassen.

## Vor Veröffentlichung anpassen

1. `index.html`: `canonical`, `og:url` und ggf. `og:image`.
2. `sitemap.xml`: echte absolute Domain einsetzen.
3. `robots.txt`: echte Sitemap-URL einsetzen.
4. `impressum.html`: tatsächliche Anbieterangaben einsetzen und rechtlich prüfen.
5. `datenschutz.html`: tatsächliche Hosting-, Speicher-, Log-, Rechtsgrundlagen- und Betroffenenangaben einsetzen und rechtlich prüfen.
6. `kontakt.html`: tatsächliche Kontaktmöglichkeit einsetzen.
7. Werbeplatzhalter erst nach Prüfung des konkreten Werbeanbieters, Consent-/Datenschutzanforderungen und technischen Vorgaben ersetzen.
8. Vor Launch Browser-/Gerätetests durchführen.

## Rechenlogik

Gewichtet:
`Durchschnitt = Summe(Note × Gewichtung) / Summe(Gewichtungen)`

Zielnote bei einer weiteren Leistung mit Gewicht 1:
`benötigte Note = Ziel × (bisherige Gewichtung + 1) − aktueller Durchschnitt × bisherige Gewichtung`

Das Ergebnis ist eine mathematische Näherung und berücksichtigt keine schulindividuellen Notenschlüssel oder Sonderregeln.
