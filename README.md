# NotenRechner

## Dateien
index.html · style.css · app.js · impressum.html · datenschutz.html · kontakt.html · robots.txt · sitemap.xml

## Lokal starten
Datei `index.html` im Browser öffnen – oder: `python3 -m http.server 8000` im Ordner, dann http://localhost:8000.

## Kostenlos veröffentlichen
Cloudflare Pages, Netlify (Drag & Drop des Ordners) oder GitHub Pages: Ordner hochladen bzw. Repo anlegen, Pages aktivieren. Eigene Domain optional.

## Vor Veröffentlichung anpassen
1. `DEINE-DOMAIN.de` in index.html (canonical, og:url), robots.txt, sitemap.xml
2. og:image (1200×630) ergänzen
3. Impressum, Datenschutz, Kontakt: alle `[PLATZHALTER …]` ersetzen und rechtlich prüfen
4. Hosting-Angaben in der Datenschutzerklärung
5. `noindex` in den drei Rechtsseiten ggf. entfernen
6. Werbung: Platzhalter `data-ad-slot` erst nach Klärung von Einwilligung (Cookie-Banner) und Datenschutz füllen
