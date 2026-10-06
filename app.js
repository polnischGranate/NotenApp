'use strict';
// ---------- Berechnungen (rein, testbar) ----------
const parse = v => { const n = parseFloat(String(v ?? '').trim().replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const validGrade = g => g >= 1 && g <= 6;
const round2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
const fmt = x => round2(x).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function average(rows, weighted) {
  let sum = 0, wsum = 0, count = 0;
  for (const r of rows) {
    const g = parse(r.grade), w = weighted ? parse(r.weight) : 1;
    if (!validGrade(g) || !(w > 0)) continue;
    sum += g * w; wsum += w; count++;
  }
  return wsum ? { avg: sum / wsum, wsum, count } : null;
}
// Note x der nächsten Leistung (Gewicht w), damit (avg*n + x*w)/(n+w) = target
function neededGrade(avg, n, target, w = 1) {
  if (![avg, n, target, w].every(Number.isFinite) || !validGrade(avg) || !validGrade(target) || n <= 0 || w <= 0) return null;
  return (target * (n + w) - avg * n) / w;
}

// ---------- Oberfläche ----------
function init() {
  const $ = s => document.querySelector(s);
  const KEY = 'notenrechner-v1';
  const blank = () => ({ name: '', grade: '', weight: '1' });
  const list = $('#rows'), out = $('#result'), store = $('#store');
  let weighted = true, rows = [blank(), blank(), blank()];

  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.rows)) { rows = s.rows; weighted = s.weighted !== false; store.checked = true; } } catch (e) {}
  document.querySelector(`input[name=mode][value=${weighted ? 'w' : 's'}]`).checked = true;

  function save() {
    try { store.checked ? localStorage.setItem(KEY, JSON.stringify({ rows, weighted })) : localStorage.removeItem(KEY); } catch (e) {}
  }
  function render() {
    list.replaceChildren();
    list.classList.toggle('simple', !weighted);
    rows.forEach((r, i) => {
      const li = document.createElement('li'); li.className = 'row';
      [['name', 'Fach', 'text', 'Fach'], ['grade', 'Note', 'text', 'Note'], ['weight', 'Gewichtung', 'text', 'Gew.']].forEach(([f, label, type, ph]) => {
        const inp = document.createElement('input');
        inp.type = type; inp.value = r[f]; inp.placeholder = ph; inp.className = 'f-' + f;
        inp.setAttribute('aria-label', `${label} ${i + 1}`);
        if (f !== 'name') inp.inputMode = 'decimal'; else inp.maxLength = 40;
        inp.addEventListener('input', () => { r[f] = inp.value; update(); });
        li.append(inp);
      });
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'btn ghost'; del.textContent = '×';
      del.setAttribute('aria-label', `Fach ${i + 1} löschen`);
      del.addEventListener('click', () => { rows.splice(i, 1); render(); update(); });
      li.append(del); list.append(li);
    });
    update();
  }
  function update() {
    [...list.children].forEach((li, i) => {
      const g = rows[i].grade.trim(), w = rows[i].weight.trim();
      li.querySelector('.f-grade').setAttribute('aria-invalid', g !== '' && !validGrade(parse(g)));
      li.querySelector('.f-weight').setAttribute('aria-invalid', weighted && w !== '' && !(parse(w) > 0));
    });
    const a = average(rows, weighted);
    out.textContent = a
      ? `Ø ${fmt(a.avg)} · ${weighted ? 'gewichtet' : 'alle gleich gewichtet'}, ${a.count} ${a.count === 1 ? 'Note' : 'Noten'}`
      : 'Trage mindestens eine Note zwischen 1 und 6 ein (Komma oder Punkt).';
    save();
  }
  document.querySelectorAll('input[name=mode]').forEach(m => m.addEventListener('change', () => { weighted = m.value === 'w'; render(); }));
  $('#add').addEventListener('click', () => { rows.push(blank()); render(); list.lastChild.querySelector('input').focus(); });
  $('#example').addEventListener('click', () => { rows = [['Mathe', '2', '2'], ['Deutsch', '1', '1'], ['Englisch', '3', '1']].map(([name, grade, weight]) => ({ name, grade, weight })); render(); });
  $('#clear').addEventListener('click', () => {
    if (!confirm('Alle eingegebenen Daten löschen?')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    rows = [blank(), blank(), blank()]; store.checked = false; $('#goal').reset(); render(); goal();
  });
  store.addEventListener('change', save);

  // Zielnote
  const gout = $('#goal-result');
  function goal() {
    const v = id => parse($(id).value);
    const [avg, n, w, t] = [v('#g-avg'), v('#g-n'), v('#g-w'), v('#g-t')];
    if ([avg, n, t].some(Number.isNaN)) { gout.textContent = 'Fülle Durchschnitt, Gewichtung bisheriger Noten und Zielnote aus.'; return; }
    const x = neededGrade(avg, n, t, Number.isNaN(w) ? 1 : w);
    if (x === null) gout.textContent = 'Bitte gültige Werte eingeben: Noten von 1 bis 6, Gewichtungen größer als 0.';
    else if (x > 6) gout.textContent = `Dein Ziel ${fmt(t)} ist rechnerisch schon sicher – selbst mit einer 6 bleibst du darunter.`;
    else if (x < 1) gout.textContent = `Das Ziel ${fmt(t)} ist mit der nächsten Leistung nicht mehr erreichbar – selbst eine 1 reicht rechnerisch nicht.`;
    else gout.textContent = `Du brauchst ungefähr eine ${fmt(x)} (rechnerisch höchstens ${(Math.floor(x * 10) / 10).toLocaleString('de-DE', { minimumFractionDigits: 1 })}), um im Schnitt ${fmt(t)} zu erreichen.`;
  }
  $('#goal').addEventListener('input', goal);
  $('#goal').addEventListener('submit', e => e.preventDefault());
  render(); goal();
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
if (typeof module !== 'undefined') module.exports = { parse, average, neededGrade, fmt };
