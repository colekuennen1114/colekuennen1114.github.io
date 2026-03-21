const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzpBziND9x_27cqnirxWJaP5d6SjzwPPR9pvpgQQEpQr6ULETwmS9EIQufVDBcyVDQ/exec";

const fieldIds = [
  "eventName",
  "scoutName",
  "teamNumber",
  "matchNumber",
  "alliance",
  "startPos",
  "autoShootDistance",
  "autoHumanPlayerFuelScored",
  "autoFuelScored",
  "autoFuelAccuracy",
  "autoFloorIntake",
  "autoTrench",
  "autoBump",
  "autoIntakeOutpost",
  "autoIntakeNeutralZone",
  "autoPassingNeutralZone",
  "autoFerryingNeutralZone",
  "autoDied",
  "teleStartPosition",
  "teleShootDistance",
  "teleFuelScored",
  "teleHumanPlayerFuelScored",
  "teleFuelAccuracy",
  "teleFloorIntake",
  "teleTrench",
  "teleBump",
  "teleIntakeOutpost",
  "teleIntakeNeutralZone",
  "telePassingNeutralZone",
  "teleFerryingNeutralZone",
  "teleDied",
  "defense",
  "driverSkill",
  "penaltyPoints",
  "violationName",
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

const getField = (id) => document.getElementById(id);

function collectEntry() {
  const entry = {};

  for (const id of fieldIds) {
    const field = getField(id);
    if (!field) continue;
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
  for (const id of fieldIds) {
    const field = getField(id);
    if (!field) continue;

    if (field.type === "checkbox") {
      field.checked = false;
    } else if (field.type === "range") {
      field.value = field.id === "defense" ? "0" : "3";
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

  getField("defenseValue").textContent = getField("defense").value;
  getField("driverValue").textContent = getField("driverSkill").value;
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

    const result = await response.json();

    if (result.status === "success") {
      clearForm();
      sessionStorage.setItem("scouting_toast", "Match submission recorded.");
      window.location.href = "./";
      return;
    }

    const errorMessage = result.message || "Submission failed.";
    setStatus(errorMessage, "error");
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
  getField(fieldId).value = String(Math.max(0, value));
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

getField("defense").addEventListener("input", (e) => {
  getField("defenseValue").textContent = e.target.value;
});

getField("driverSkill").addEventListener("input", (e) => {
  getField("driverValue").textContent = e.target.value;
});

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

for (const fieldId of ["autoHumanPlayerFuelScored", "autoFuelScored", "autoFuelAccuracy", "teleHumanPlayerFuelScored", "teleFuelScored", "teleFuelAccuracy", "penaltyPoints"]) {
  getField(fieldId).addEventListener("input", () => setCounterValue(fieldId, getCounterValue(fieldId)));
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

showStep(0);
window.ScoutingSync.registerServiceWorker();
