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
const entriesKey = "frc2026_scout_entries";

function collectEntry() {
  const entry = {};
  for (const id of ids) {
    const field = getField(id);
    entry[id] = field.type === "checkbox" ? field.checked : field.value;
  }
  entry.timestamp = new Date().toISOString();
  return entry;
}

function getEntries() {
  return JSON.parse(localStorage.getItem(entriesKey) || "[]");
}

function saveEntry() {
  const entries = getEntries();
  entries.push(collectEntry());
  localStorage.setItem(entriesKey, JSON.stringify(entries));
  getField("entryCount").textContent = String(entries.length);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv() {
  const entries = getEntries();
  if (entries.length === 0) {
    alert("No entries saved yet.");
    return;
  }

  const columns = [...ids, "timestamp"];
  const lines = [columns.join(",")];

  for (const row of entries) {
    lines.push(columns.map((column) => escapeCsv(row[column])).join(","));
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "frc2026_scouting_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function clearEntries() {
  localStorage.removeItem(entriesKey);
  getField("entryCount").textContent = "0";
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

getField("entryCount").textContent = String(getEntries().length);
