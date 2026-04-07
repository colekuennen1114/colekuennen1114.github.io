const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKBs9pESN6pmke2f-3QiKSETFYx_U1RnM-qROYoAn8v1m_VHzVE0FThj_lo9mPtCUZ/exec";

const fieldIds = [
  "eventName",
  "scoutName",
  "teamNumber",
  "matchNumber",
  "alliance",
  "startPos",
  "autoShootDistance",
  "autoFuelScored",
  "autoFuelAccuracy",
  "autoFloorIntake",
  "autoTrench",
  "autoPassingNeutralZone",
  "autoFerryingNeutralZone",
  "autoDied",
  "teleShootDistance",
  "teleFuelScored",
  "teleFuelAccuracy",
  "teleFloorIntake",
  "teleTrench",
  "telePassingNeutralZone",
  "teleFerryingNeutralZone",
  "teleDied",
  "defense",
  "driverSkill",
  "penaltyPoints",
  "violationName",
  "estimatedBallsPerSecond",
  "estimatedHopperCapacity",
  "teleopStrategy",
  "driverAdaptability",
  "specificBotProblems",
  "kitbot",
  "notes",
];

const radioGroups = ["autoClimb", "teleClimb"];
const stepPanels = Array.from(document.querySelectorAll(".form-step"));
const submitButton = document.getElementById("saveBtn");
const downloadButton = document.getElementById("downloadBtn");
const clearButton = document.getElementById("clearBtn");
const clearDataModal = document.getElementById("clearDataModal");
const confirmClearBtn = document.getElementById("confirmClearBtn");
const cancelClearBtn = document.getElementById("cancelClearBtn");
const statusMessage = document.getElementById("submitStatus");
const statusPrimary = document.getElementById("submitStatusPrimary");
const statusHint = document.getElementById("submitStatusHint");
let currentStep = 0;
const stickyFieldIds = ["eventName", "scoutName", "alliance"];
const stickyValuesKey = "frc2026_match_sticky_values";

const getField = (id) => document.getElementById(id);

function collectEntry() {
  const entry = {};

  for (const id of fieldIds) {
    const field = getField(id);
    if (!field) continue;
    if ((id === "defense" || id === "driverSkill") && field.dataset.touched !== "true") {
      entry[field.name || field.id] = "";
      continue;
    }
    entry[field.name || field.id] = field.type === "checkbox" ? field.checked : field.value;
  }

  for (const groupName of radioGroups) {
    entry[groupName] = document.querySelector(`input[name="${groupName}"]:checked`)?.value || "";
  }

  entry.timestamp = new Date().toISOString();
  return entry;
}

function setStatus(message, tone = "", hint = "") {
  if (!statusMessage) return;
  if (statusPrimary) {
    statusPrimary.textContent = message;
  } else {
    statusMessage.textContent = message;
  }
  if (statusHint) {
    statusHint.textContent = hint;
    statusHint.hidden = !hint;
  }
  statusMessage.className = `tiny status-message${tone ? ` ${tone}` : ""}`;
}

function clearForm() {
  const stickyValues = {};
  for (const stickyFieldId of stickyFieldIds) {
    const field = getField(stickyFieldId);
    if (field) stickyValues[stickyFieldId] = field.value;
  }

  for (const id of fieldIds) {
    const field = getField(id);
    if (!field) continue;

    if (field.type === "checkbox") {
      field.checked = false;
    } else if (field.type === "range") {
      field.value = "0";
      field.dataset.touched = "false";
    } else if (field.tagName === "SELECT") {
      field.selectedIndex = 0;
    } else {
      field.value = field.defaultValue || "";
    }
  }

  for (const groupName of radioGroups) {
    const checked = document.querySelector(`input[name="${groupName}"]:checked`);
    if (checked) {
      checked.checked = false;
    }
  }
  const defaultTeleClimb = document.querySelector('input[name="teleClimb"][value="No Climb"]');
  const defaultAutoClimb = document.querySelector('input[name="autoClimb"][value="No Climb"]');
  if (defaultAutoClimb) {
    defaultAutoClimb.checked = true;
  }
  if (defaultTeleClimb) {
    defaultTeleClimb.checked = true;
  }

  getField("defenseValue").textContent = "Not set";
  getField("driverValue").textContent = "Not set";

  for (const stickyFieldId of stickyFieldIds) {
    const field = getField(stickyFieldId);
    if (field && stickyValues[stickyFieldId] !== undefined) {
      field.value = stickyValues[stickyFieldId];
    }
  }
  showStep(0);
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv() {
  const entry = collectEntry();
  const headers = Object.keys(entry);
  const csv = [
    headers.join(","),
    headers.map((header) => escapeCsvValue(entry[header])).join(","),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "frc2026_match_entry.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function setSubmittingState(isSubmitting) {
  submitButton.disabled = isSubmitting;
  downloadButton.disabled = isSubmitting;
  clearButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Submitting…" : "Submit Match Entry";
}

async function submitEntry() {
  if (!APPS_SCRIPT_URL) {
    setStatus("Add the Google Apps Script Web App URL before submitting.", "error");
    return;
  }

  setSubmittingState(true);
  setStatus("Submitting…", "", "This can take up to a couple minutes.");

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(collectEntry()),
    });

    const responseText = await response.text();
    let result = {};
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = { status: "error", message: responseText || "Submission failed." };
    }

    if (response.ok && result.status === "success") {
      clearForm();
      sessionStorage.setItem("scouting_toast", "Match submission recorded.");
      window.location.href = "./";
      return;
    }

    const rawMessage = result.message || result.error || "Submission failed.";
    if (String(rawMessage).includes("OTHER_FIELD_TO_COL is not defined")) {
      setStatus(
        "Apps Script deployment error: OTHER_FIELD_TO_COL is undefined.",
        "error",
        "This is in the Google Apps Script backend, not this page. Re-deploy after defining OTHER_FIELD_TO_COL."
      );
      return;
    }

    setStatus(rawMessage, "error");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Unable to submit the form.", "error");
  } finally {
    setSubmittingState(false);
  }
}

function openClearModal() {
  clearDataModal.hidden = false;
  confirmClearBtn.focus();
}

function closeClearModal() {
  clearDataModal.hidden = true;
  clearButton.focus();
}

function setCounterValue(fieldId, value) {
  const field = getField(fieldId);
  if (!field) return;
  const min = field.min === "" ? Number.NaN : Number(field.min);
  const max = field.max === "" ? Number.NaN : Number(field.max);
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : Number.POSITIVE_INFINITY;
  const clamped = Math.min(safeMax, Math.max(safeMin, value));
  field.value = String(clamped);
}

function getCounterValue(fieldId) {
  const value = Number(getField(fieldId).value || 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function adjustCounter(fieldId, delta) {
  setCounterValue(fieldId, getCounterValue(fieldId) + delta);
}

function showStep(stepIndex) {
  currentStep = Math.max(0, Math.min(3, stepIndex));
  for (const panel of stepPanels) {
    const panelStep = Number(panel.dataset.step);
    panel.classList.toggle("is-active", panelStep === currentStep);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

for (const sliderId of ["defense", "driverSkill"]) {
  const slider = getField(sliderId);
  const output = getField(sliderId === "defense" ? "defenseValue" : "driverValue");
  slider.dataset.touched = "false";
  slider.addEventListener("input", () => {
    slider.dataset.touched = "true";
    output.textContent = slider.value;
  });
}

submitButton.addEventListener("click", submitEntry);
downloadButton.addEventListener("click", downloadCsv);
clearButton.addEventListener("click", openClearModal);
confirmClearBtn.addEventListener("click", () => {
  clearForm();
  setStatus("");
  closeClearModal();
});
cancelClearBtn.addEventListener("click", closeClearModal);
clearDataModal.addEventListener("click", (event) => {
  if (event.target === clearDataModal) {
    closeClearModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !clearDataModal.hidden) {
    closeClearModal();
  }
});

for (const fieldId of ["autoFuelScored", "autoFuelAccuracy", "teleFuelScored", "teleFuelAccuracy", "penaltyPoints"]) {
  getField(fieldId).addEventListener("input", () => {
    const field = getField(fieldId);
    if (field.value === "") return;
    setCounterValue(fieldId, getCounterValue(fieldId));
  });
}

function saveStickyValues() {
  const values = {};
  for (const stickyFieldId of stickyFieldIds) {
    const field = getField(stickyFieldId);
    if (field) values[stickyFieldId] = field.value;
  }
  localStorage.setItem(stickyValuesKey, JSON.stringify(values));
}

function loadStickyValues() {
  const saved = JSON.parse(localStorage.getItem(stickyValuesKey) || "{}");
  for (const stickyFieldId of stickyFieldIds) {
    const field = getField(stickyFieldId);
    if (field && typeof saved[stickyFieldId] === "string") {
      field.value = saved[stickyFieldId];
    }
  }
}

for (const stickyFieldId of stickyFieldIds) {
  getField(stickyFieldId).addEventListener("input", saveStickyValues);
  getField(stickyFieldId).addEventListener("change", saveStickyValues);
}

const counterBindings = [
  ["autoFuelPlus1", "autoFuelScored", 1],
  ["autoFuelPlus3", "autoFuelScored", 3],
  ["autoFuelPlus5", "autoFuelScored", 5],
  ["autoFuelPlus10", "autoFuelScored", 10],
  ["autoFuelMinus1", "autoFuelScored", -1],
  ["autoFuelMinus3", "autoFuelScored", -3],
  ["autoFuelMinus5", "autoFuelScored", -5],
  ["autoFuelMinus10", "autoFuelScored", -10],
  ["teleFuelPlus1", "teleFuelScored", 1],
  ["teleFuelPlus3", "teleFuelScored", 3],
  ["teleFuelPlus5", "teleFuelScored", 5],
  ["teleFuelPlus10", "teleFuelScored", 10],
  ["teleFuelMinus1", "teleFuelScored", -1],
  ["teleFuelMinus3", "teleFuelScored", -3],
  ["teleFuelMinus5", "teleFuelScored", -5],
  ["teleFuelMinus10", "teleFuelScored", -10],
];

for (const [buttonId, fieldId, delta] of counterBindings) {
  const button = getField(buttonId);
  button.addEventListener("click", () => adjustCounter(fieldId, delta));
  button.addEventListener("dblclick", (event) => event.preventDefault());
}

for (const button of document.querySelectorAll(".nav-step-btn")) {
  button.addEventListener("click", () => {
    const delta = button.dataset.nav === "next" ? 1 : -1;
    showStep(currentStep + delta);
  });
}

const matchBackHomeLink = getField("matchBackHomeLink");
if (matchBackHomeLink) {
  matchBackHomeLink.addEventListener("click", (event) => {
    const confirmed = window.confirm("Leave match scouting and go back home? Any unsaved changes will be lost.");
    if (!confirmed) {
      event.preventDefault();
    }
  });
}

loadStickyValues();
showStep(0);
window.ScoutingSync.registerServiceWorker();
