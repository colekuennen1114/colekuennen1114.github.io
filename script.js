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
  "autoBump",
  "autoIntakeOutpost",
  "autoIntakeNeutralZone",
  "autoPassingNeutralZone",
  "autoFerryingNeutralZone",
  "autoDied",
  "autoClimbOtherText",
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
  "teleClimbOtherText",
  "defense",
  "driverSkill",
  "penaltyPoints",
  "violationName",
  "notes",
];

const radioGroups = ["autoClimb", "teleClimb"];
const stepPanels = Array.from(document.querySelectorAll(".form-step"));
let currentStep = 0;

const getField = (id) => document.getElementById(id);

function collectEntry() {
  const entry = {};
  for (const id of fieldIds) {
    const field = getField(id);
    entry[id] = field.type === "checkbox" ? field.checked : field.value;
  }
  for (const groupName of radioGroups) {
    entry[groupName] = document.querySelector(`input[name="${groupName}"]:checked`)?.value || "";
  }
  entry.timestamp = new Date().toISOString();
  return entry;
}

function updateEntryCount() {
  getField("entryCount").textContent = String(window.ScoutingSync.getEntries().length);
}

function clearForm() {
  for (const id of fieldIds) {
    const field = getField(id);
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

  getField("autoClimbOtherWrap").hidden = true;
  getField("autoClimbOtherText").disabled = true;
  getField("teleClimbOtherWrap").hidden = true;
  getField("teleClimbOtherText").disabled = true;
  getField("defenseValue").textContent = getField("defense").value;
  getField("driverValue").textContent = getField("driverSkill").value;
  showStep(0);
}

async function saveEntry() {
  const entry = collectEntry();
  window.ScoutingSync.queueEntry(entry);
  updateEntryCount();
  clearForm();

  try {
    await window.ScoutingSync.flushPendingUploads();
  } catch {
    // Keep offline entries queued for later upload.
  }

  sessionStorage.setItem("scouting_toast", "Your entry has been saved.");
  window.location.href = "index.html";
}

function downloadCsv() {
  const entries = window.ScoutingSync.getEntries();
  if (entries.length === 0) {
    alert("No entries saved yet.");
    return;
  }

  const blob = new Blob([window.ScoutingSync.toCsv(entries)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "frc2026_scouting_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function clearEntries() {
  localStorage.removeItem(window.ScoutingSync.entriesKey);
  localStorage.removeItem("frc2026_pending_uploads");
  updateEntryCount();
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


function setConditionalOtherField(groupName, fieldId, wrapId) {
  const syncState = () => {
    const isOther = document.querySelector(`input[name="${groupName}"]:checked`)?.value === "Other";
    const wrap = getField(wrapId);
    const field = getField(fieldId);
    wrap.hidden = !isOther;
    field.disabled = !isOther;
    if (!isOther) {
      field.value = "";
    }
  };

  for (const radio of document.querySelectorAll(`input[name="${groupName}"]`)) {
    radio.addEventListener("change", syncState);
  }

  syncState();
}

function setupConfirmButton(buttonId, onConfirm) {
  const button = getField(buttonId);
  const defaultText = button.dataset.confirmDefault || button.textContent;
  const confirmText = button.dataset.confirmText || "Confirm";
  let armed = false;
  let timeoutId;

  const reset = () => {
    armed = false;
    button.textContent = defaultText;
    button.classList.remove("confirming");
    window.clearTimeout(timeoutId);
  };

  button.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      button.textContent = confirmText;
      button.classList.add("confirming");
      timeoutId = window.setTimeout(reset, 4000);
      return;
    }

    reset();
    onConfirm();
  });
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

getField("saveBtn").addEventListener("click", saveEntry);
getField("downloadBtn").addEventListener("click", downloadCsv);
setupConfirmButton("clearBtn", clearEntries);

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

updateEntryCount();
showStep(0);
window.ScoutingSync.registerServiceWorker();
window.ScoutingSync.flushPendingUploads().catch(() => {});


setConditionalOtherField("autoClimb", "autoClimbOtherText", "autoClimbOtherWrap");
setConditionalOtherField("teleClimb", "teleClimbOtherText", "teleClimbOtherWrap");
