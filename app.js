(() => {
  "use strict";

  const STORAGE_KEY = "notenrechner-v1";
  const DEFAULT_GRADE = () => ({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), subject: "", grade: "", weight: "1" });
  let state = {
    mode: "weighted",
    grades: [DEFAULT_GRADE()],
    saveLocal: false
  };

  const $ = (selector) => document.querySelector(selector);
  const gradeList = $("#gradeList");

  function parseNumber(value) {
    if (typeof value !== "string") return Number(value);
    return Number(value.trim().replace(",", "."));
  }

  function validGrade(grade) {
    return Number.isFinite(grade) && grade >= 1 && grade <= 6;
  }

  function validWeight(weight) {
    return Number.isFinite(weight) && weight > 0;
  }

  function format(value) {
    return Number.isFinite(value) ? value.toFixed(2).replace(".", ",") : "–";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    gradeList.innerHTML = "";
    state.grades.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "grade-row";
      row.dataset.id = item.id;
      row.innerHTML = `
        <div class="row-number">${index + 1}</div>
        <label class="field subject-field">
          <span>Fach</span>
          <input data-field="subject" type="text" maxlength="80" value="${escapeHtml(item.subject)}" placeholder="z. B. Mathe" autocomplete="off">
        </label>
        <label class="field">
          <span>Note</span>
          <input data-field="grade" type="number" min="1" max="6" step="0.01" value="${escapeHtml(item.grade)}" placeholder="1–6" inputmode="decimal">
        </label>
        <label class="field weight-field">
          <span>Gewichtung</span>
          <input data-field="weight" type="number" min="0.01" step="0.01" value="${escapeHtml(item.weight)}" placeholder="1" inputmode="decimal" ${state.mode === "simple" ? "disabled" : ""}>
        </label>
        <button class="icon-delete" data-action="delete" type="button" aria-label="Fach löschen">×</button>
        <p class="row-error" data-error></p>
      `;
      gradeList.appendChild(row);
    });
    document.querySelectorAll(".mode-button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === state.mode);
    });
    $("#saveLocal").checked = state.saveLocal;
    calculate();
  }

  function updateItem(row) {
    const item = state.grades.find(g => g.id === row.dataset.id);
    if (!item) return;
    row.querySelectorAll("[data-field]").forEach(input => item[input.dataset.field] = input.value);
  }

  function calculate() {
    let valid = 0, sum = 0, totalWeight = 0;
    state.grades.forEach((item, index) => {
      const grade = parseNumber(item.grade);
      const weight = state.mode === "simple" ? 1 : parseNumber(item.weight);
      const row = gradeList.children[index];
      const error = row?.querySelector("[data-error]");
      let message = "";
      if (item.grade !== "" && !validGrade(grade)) message = "Note muss zwischen 1,00 und 6,00 liegen.";
      else if (state.mode === "weighted" && item.weight !== "" && !validWeight(weight)) message = "Gewichtung muss größer als 0 sein.";
      if (error) error.textContent = message;
      if (!message && validGrade(grade) && validWeight(weight)) {
        valid++;
        sum += grade * weight;
        totalWeight += weight;
      }
    });
    const avg = totalWeight ? sum / totalWeight : NaN;
    $("#averageResult").textContent = format(avg);
    $("#heroAverage").textContent = format(avg);
    $("#validCount").textContent = String(valid);
    $("#totalWeight").textContent = state.mode === "simple" ? String(valid) : format(totalWeight);
    $("#averageDetails").textContent = Number.isFinite(avg)
      ? `${state.mode === "weighted" ? "Gewichteter" : "Einfacher"} Durchschnitt aus ${valid} gültigen ${valid === 1 ? "Note" : "Noten"}.`
      : "Füge mindestens eine gültige Note hinzu.";
    if (state.saveLocal) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.grades) && saved.grades.length) {
        state = {
          mode: saved.mode === "simple" ? "simple" : "weighted",
          grades: saved.grades.map(g => ({
            id: String(g.id || Date.now() + Math.random()),
            subject: String(g.subject || ""),
            grade: String(g.grade ?? ""),
            weight: String(g.weight ?? "1")
          })),
          saveLocal: Boolean(saved.saveLocal)
        };
      }
    } catch (_) {
      // Defekte lokale Daten werden ignoriert.
    }
  }

  function deleteAll() {
    state.grades = [DEFAULT_GRADE()];
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  gradeList.addEventListener("input", (event) => {
    const row = event.target.closest(".grade-row");
    if (row) {
      updateItem(row);
      calculate();
    }
  });

  gradeList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='delete']");
    if (!button) return;
    const row = button.closest(".grade-row");
    state.grades = state.grades.filter(g => g.id !== row.dataset.id);
    if (!state.grades.length) state.grades.push(DEFAULT_GRADE());
    render();
  });

  $("#addGrade").addEventListener("click", () => {
    state.grades.push(DEFAULT_GRADE());
    render();
    const inputs = gradeList.querySelectorAll("input[data-field='subject']");
    inputs[inputs.length - 1]?.focus();
  });

  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      render();
    });
  });

  $("#clearAll").addEventListener("click", () => {
    if (confirm("Wirklich alle Noten und lokal gespeicherten Eingaben löschen?")) deleteAll();
  });

  $("#saveLocal").addEventListener("change", (event) => {
    state.saveLocal = event.target.checked;
    if (state.saveLocal) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  });

  $("#themeToggle").addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("notenrechner-theme", dark ? "dark" : "light");
  });

  $("#targetForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const current = parseNumber($("#currentAverage").value);
    const previous = parseNumber($("#previousWeight").value);
    const target = parseNumber($("#targetAverage").value);
    const result = $("#targetResult");
    result.hidden = false;

    if (!validGrade(current) || !Number.isFinite(previous) || previous <= 0 || !validGrade(target)) {
      result.className = "target-result error";
      result.textContent = "Bitte gib einen aktuellen Durchschnitt und eine Zielnote zwischen 1,00 und 6,00 sowie eine positive bisherige Gewichtung ein.";
      return;
    }

    const needed = target * (previous + 1) - current * previous;
    result.className = "target-result";
    if (needed < 1) {
      result.innerHTML = "<strong>Du hast dein Ziel bereits rechnerisch erreicht.</strong><br>Selbst eine sehr gute weitere Note würde dein Ziel nicht gefährden.";
    } else if (needed > 6) {
      result.innerHTML = `<strong>Mit nur einer weiteren Leistung ist das Ziel rechnerisch nicht erreichbar.</strong><br>Benötigte Note: <b>${format(needed)}</b> (schlechter als 6,00).`;
    } else {
      result.innerHTML = `<strong>Du brauchst ungefähr eine ${format(needed)}.</strong><br>Das ist der mathematische Wert für die nächste gleich gewichtete Leistung.`;
    }
  });

  const savedTheme = localStorage.getItem("notenrechner-theme");
  if (savedTheme === "dark") document.documentElement.classList.add("dark");
  load();
  render();
})();
