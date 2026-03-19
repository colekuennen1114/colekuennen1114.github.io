const ids = [
  "eventName",
  "scoutName",
  "teamNumber",
  "matchNumber",
  "alliance",
  "startPos",
  "autoStartPosition",
  "autoShootPosition",
  "autoFuelScored",
  "autoPassNeutralZone",
  "autoClimbL1",
  "autoDepotPickup",
  "autoOutpostPickup",
  "autoNeutralZonePickup",
  "teleShootPosition",
  "teleFuelScored",
  "fuelScoredCounter",
  "telePassNeutralZone",
  "telePassOpponentZone",
  "teleDepotPickup",
  "teleOutpostPickup",
  "teleFloorPickup",
  "endgame",
  "defense",
  "driverSkill",
  "died",
  "notes",
];

const getField = (id) => document.getElementById(id);

function collectEntry() {
  const entry = {};
  for (const id of ids) {
    const field = getField(id);
    entry[id] = field.type === "checkbox" ? field.checked : field.value;
  }
  entry.timestamp = new Date().toISOString();
  return entry;
}

function updateEntryCount() {
  getField("entryCount").textContent = String(window.ScoutingSync.getEntries().length);
}

function clearForm() {
  for (const id of ids) {
    const field = getField(id);
    if (field.type === "checkbox") {
      field.checked = false;
    } else if (field.type === "range") {
      field.value = field.id === "defense" ? "2" : "3";
    } else if (field.tagName === "SELECT") {
      field.selectedIndex = 0;
    } else {
      field.value = field.defaultValue || "";
    }
  }
  getField("defenseValue").textContent = getField("defense").value;
  getField("driverValue").textContent = getField("driverSkill").value;
  setCounterValue(getCounterValue());
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

getField("defense").addEventListener("input", (e) => {
  getField("defenseValue").textContent = e.target.value;
});

getField("driverSkill").addEventListener("input", (e) => {
  getField("driverValue").textContent = e.target.value;
});

getField("saveBtn").addEventListener("click", saveEntry);
getField("downloadBtn").addEventListener("click", downloadCsv);
getField("clearBtn").addEventListener("click", clearEntries);

function getCounterValue() {
  const value = Number(getField("fuelScoredCounter").value || 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function setCounterValue(value) {
  getField("fuelScoredCounter").value = String(Math.max(0, value));
}

function adjustCounter(delta) {
  setCounterValue(getCounterValue() + delta);
}

getField("fuelPlus1").addEventListener("click", () => adjustCounter(1));
getField("fuelPlus3").addEventListener("click", () => adjustCounter(3));
getField("fuelPlus5").addEventListener("click", () => adjustCounter(5));
getField("fuelMinus1").addEventListener("click", () => adjustCounter(-1));
getField("fuelMinus3").addEventListener("click", () => adjustCounter(-3));
getField("fuelMinus5").addEventListener("click", () => adjustCounter(-5));
getField("fuelScoredCounter").addEventListener("input", () => setCounterValue(getCounterValue()));

updateEntryCount();
window.ScoutingSync.registerServiceWorker();
window.ScoutingSync.flushPendingUploads().catch(() => {});

for (const id of ["fuelPlus1", "fuelPlus3", "fuelPlus5", "fuelMinus1", "fuelMinus3", "fuelMinus5"]) {
  const button = getField(id);
  button.addEventListener("dblclick", (event) => event.preventDefault());
}
