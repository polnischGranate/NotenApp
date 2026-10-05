// Kleine Node-Testdatei für die Kernformeln.
// Start: node tests.js
function avg(items, weighted = true) {
  let sum = 0, weight = 0;
  for (const x of items) {
    if (x.grade < 1 || x.grade > 6) continue;
    const w = weighted ? x.weight : 1;
    if (!(w > 0)) continue;
    sum += x.grade * w;
    weight += w;
  }
  return weight ? sum / weight : NaN;
}
function target(current, previous, goal) {
  return goal * (previous + 1) - current * previous;
}
const tests = [
  [avg([{grade:2,weight:2},{grade:1,weight:1},{grade:3,weight:1}]), 2],
  [avg([{grade:2,weight:2},{grade:1,weight:1},{grade:3,weight:1}], false), 2],
  [target(2.4, 5, 2), 0],
  [avg([{grade:1,weight:1},{grade:6,weight:1},{grade:3,weight:2}]), 3.25],
];
for (const [actual, expected] of tests) {
  if (Math.abs(actual - expected) > 1e-9) throw new Error(`Test fehlgeschlagen: ${actual} != ${expected}`);
}
if (!Number.isNaN(avg([{grade:7,weight:1}]))) throw new Error("Ungültige Note wurde akzeptiert");
if (!(target(3, 4, 2) < 1)) throw new Error("Unerreichbarkeitsfall falsch klassifiziert");
console.log("Alle Kernberechnungen bestanden.");
