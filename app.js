'use strict';
// ---------- Berechnungen (rein, testbar) ----------
const parse = v => { const n = parseFloat(String(v ?? '').trim().replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const validGrade = g => g >= 1 && g <= 6;
const round2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
const fmt = x => round2(x).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SA = 'Schulaufgabe';
const TYPES = [SA, 'Stegreifaufgabe', 'Abfrage', 'Präsentation', 'Mitarbeit', 'Sonstiges'];
// (Schulaufgabenschnitt + Schulaufgabenschnitt + Schnitt übrige Leistungen) / 3; fehlt eine Gruppe, zählt nur die andere
const combine = (sa, re) => (sa !== null && re !== null ? (2 * sa + re) / 3 : (sa ?? re));

function subjectAverage(grades) {
  const s = [0, 0], r = [0, 0];
  for (const g of grades) {
    const v = parse(g.value);
    if (!validGrade(v)) continue;
    const t = g.type === SA ? s : r;
    t[0] += v; t[1]++;
  }
  const sa = s[1] ? s[0] / s[1] : null, re = r[1] ? r[0] / r[1] : null;
  return { sa, re, fach: combine(sa, re), n: s[1] + r[1] };
}
function overallAverage(subjects) {
  let sum = 0, count = 0;
  for (const x of subjects) { const f = subjectAverage(x.grades).fach; if (f !== null) { sum += f; count++; } }
  return count ? { avg: sum / count, count } : null;
}
// Alle Noten gleich gewichtet: Note der nächsten Leistung für den Zielschnitt
function neededGrade(avg, n, target) {
  if (!validGrade(avg) || !validGrade(target) || !(n > 0)) return null;
  return target * (n + 1) - avg * n;
}
// Mit Schulaufgaben-Regel: Fachschnitt ist linear in der neuen Note x, daher aus zwei Stützstellen lösbar
function neededWithSA(sa, saN, re, reN, target, nextIsSA) {
  const f = x => {
    const s = [saN ? sa * saN : 0, saN], r = [reN ? re * reN : 0, reN];
    const g = nextIsSA ? s : r; g[0] += x; g[1]++;
    return combine(s[1] ? s[0] / s[1] : null, r[1] ? r[0] / r[1] : null);
  };
  const f0 = f(0);
  return (target - f0) / (f(1) - f0);
}

// ---------- Oberfläche ----------
function init() {
  const $ = s => document.querySelector(s);
  const KEY = 'notenrechner-v2';
  const CTRL = 'min-height:3rem;font:inherit;color:inherit;background:var(--bg);border:2px solid var(--line);border-radius:.6rem;padding:.5rem';
  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
  const newGrade = type => ({ type: type || SA, value: '' });
  const newSubject = () => ({ name: '', grades: [newGrade()] });
  const list = $('#subjects'), out = $('#result'), store = $('#store');
  let subjects = [newSubject()], marks = [], sums = [];

  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.subjects) && s.subjects.length) { subjects = s.subjects; store.checked = true; } } catch (e) {}
  const save = () => { try { store.checked ? localStorage.setItem(KEY, JSON.stringify({ subjects })) : localStorage.removeItem(KEY); } catch (e) {} };

  function render(focus) {
    list.replaceChildren(); marks = []; sums = [];
    let target = null;
    subjects.forEach((s, i) => {
      const li = mk('li', 'card');
      const head = mk('div'); head.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.75rem';
      const name = mk('input'); name.type = 'text'; name.value = s.name; name.placeholder = 'Fach (z. B. Mathe)'; name.maxLength = 40;
      name.setAttribute('aria-label', `Fachname ${i + 1}`);
      name.addEventListener('input', () => { s.name = name.value; save(); });
      const delS = mk('button', 'btn danger', 'Fach löschen'); delS.type = 'button'; delS.style.whiteSpace = 'nowrap';
      delS.addEventListener('click', () => { subjects.splice(i, 1); if (!subjects.length) subjects.push(newSubject()); render(); });
      head.append(name, delS); li.append(head);
      s.grades.forEach((g, j) => {
        const row = mk('div'); row.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.5rem';
        const sel = mk('select'); sel.style.cssText = CTRL + ';flex:2;min-width:0';
        sel.setAttribute('aria-label', `Art der Note ${j + 1} in ${s.name || 'Fach ' + (i + 1)}`);
        TYPES.forEach(t => { const o = mk('option', '', t); o.value = t; sel.append(o); });
        sel.value = g.type; sel.addEventListener('change', () => { g.type = sel.value; update(); });
        const inp = mk('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.placeholder = 'Note'; inp.value = g.value; inp.style.flex = '1';
        inp.setAttribute('aria-label', `Note ${j + 1} in ${s.name || 'Fach ' + (i + 1)}`);
        inp.addEventListener('input', () => { g.value = inp.value; update(); });
        const del = mk('button', 'btn ghost', '×'); del.type = 'button'; del.setAttribute('aria-label', `Note ${j + 1} löschen`);
        del.addEventListener('click', () => { s.grades.splice(j, 1); render(); });
        row.append(sel, inp, del); li.append(row); marks.push([inp, g]);
        if (focus && focus.i === i && focus.j === j) target = inp;
      });
      const add = mk('button', 'btn ghost', '+ Note hinzufügen'); add.type = 'button';
      add.addEventListener('click', () => { const last = s.grades[s.grades.length - 1]; s.grades.push(newGrade(last && last.type)); render({ i, j: s.grades.length - 1 }); });
      const sum = mk('p', 'hint'); sum.style.margin = '.75rem 0 0'; sums.push(sum);
      li.append(add, sum); list.append(li);
    });
    if (target) target.focus();
    update();
  }
  function update() {
    marks.forEach(([inp, g]) => inp.setAttribute('aria-invalid', g.value.trim() !== '' && !validGrade(parse(g.value))));
    subjects.forEach((s, i) => {
      const a = subjectAverage(s.grades), d = x => (x === null ? '–' : fmt(x));
      sums[i].textContent = a.fach === null ? 'Noch keine gültige Note (1 bis 6).' : `Schulaufgaben Ø ${d(a.sa)} · Übrige Leistungen Ø ${d(a.re)} · Fach Ø ${fmt(a.fach)}`;
    });
    const o = overallAverage(subjects);
    out.textContent = o ? `Gesamtschnitt Ø ${fmt(o.avg)} aus ${o.count} ${o.count === 1 ? 'Fach' : 'Fächern'}` : 'Trage mindestens eine Note zwischen 1 und 6 ein (Komma oder Punkt).';
    save();
  }
  $('#add-subject').addEventListener('click', () => { subjects.push(newSubject()); render(); list.lastChild.querySelector('input').focus(); });
  $('#example').addEventListener('click', () => {
    const g = (type, value) => ({ type, value });
    subjects = [
      { name: 'Mathe', grades: [g(SA, '2'), g(SA, '3'), g('Abfrage', '1'), g('Stegreifaufgabe', '2')] },
      { name: 'Deutsch', grades: [g(SA, '1'), g('Mitarbeit', '2')] }];
    render();
  });
  $('#clear').addEventListener('click', () => {
    if (!confirm('Alle eingegebenen Daten löschen?')) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    subjects = [newSubject()]; store.checked = false; $('#goal').reset(); $('#goal-sa').reset(); render(); goal(); goalSA();
  });
  store.addEventListener('change', save);

  // Notenvorschau
  const show = (el, x, t) => {
    el.textContent = x === null || Number.isNaN(x) ? 'Bitte gültige Werte eingeben: Noten von 1 bis 6, Anzahl mindestens 1.'
      : x > 6 ? `Dein Ziel ${fmt(t)} ist rechnerisch schon sicher – selbst mit einer 6 bleibst du darunter.`
      : x < 1 ? `Das Ziel ${fmt(t)} ist mit der nächsten Leistung nicht mehr erreichbar – selbst eine 1 reicht rechnerisch nicht.`
      : `Du brauchst ungefähr eine ${fmt(x)}, um im Schnitt ${fmt(t)} zu erreichen.`;
  };
  function goal() {
    const el = $('#goal-result'), [avg, n, t] = ['#g-avg', '#g-n', '#g-t'].map(id => parse($(id).value));
    if ([avg, n, t].some(Number.isNaN)) { el.textContent = 'Fülle Durchschnitt, Anzahl der Noten und Zielnote aus.'; return; }
    show(el, neededGrade(avg, n, t), t);
  }
  function goalSA() {
    const el = $('#goal-sa-result'), cnt = id => Math.max(0, parseInt($(id).value, 10) || 0);
    const sn = cnt('#s-san'), rn = cnt('#s-ren'), sa = parse($('#s-sa').value), re = parse($('#s-re').value), t = parse($('#s-t').value);
    if (Number.isNaN(t)) { el.textContent = 'Gib mindestens die Zielnote für das Fach ein.'; return; }
    const ok = (c, a) => c === 0 || validGrade(a);
    show(el, validGrade(t) && ok(sn, sa) && ok(rn, re) ? neededWithSA(sa || 0, sn, re || 0, rn, t, $('#s-next').value === 'sa') : null, t);
  }
  $('#goal').addEventListener('input', goal);
  $('#goal-sa').addEventListener('input', goalSA);
  $('#goal-sa').addEventListener('change', goalSA);
  document.querySelectorAll('form').forEach(f => f.addEventListener('submit', e => e.preventDefault()));
  render(); goal(); goalSA();
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
if (typeof module !== 'undefined') module.exports = { parse, subjectAverage, overallAverage, neededGrade, neededWithSA, fmt, SA };
