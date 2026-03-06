const ids = [
  "eventName",
  "scoutName",
  "teamNumber",
  "matchNumber",
  "alliance",
  "startPos",
  "autoCoral",
  "autoAlgae",
  "leftZone",
  "teleCoral",
  "teleAlgae",
  "netScores",
  "endgame",
  "defense",
  "driverSkill",
  "died",
  "notes",
];

const getField = (id) => document.getElementById(id);
const entriesKey = "frc2026_scout_entries";

function numeric(id) {
  return Number(getField(id).value || 0);
}

function recomputeSummary() {
  const autoPoints = numeric("autoCoral") * 4 + numeric("autoAlgae") * 2 + (getField("leftZone").checked ? 3 : 0);
  const telePoints = numeric("teleCoral") * 3 + numeric("teleAlgae") * 2 + numeric("netScores") * 4;
  const endgameBonus = {
    None: 0,
    Park: 2,
    "Shallow Cage": 6,
    "Deep Cage": 12,
  }[getField("endgame").value] ?? 0;

  let total = autoPoints + telePoints + endgameBonus;
  if (getField("died").checked) {
    total -= 8;
  }

  getField("summary").textContent = `Estimated contribution: ${Math.max(0, total)} pts`;
}

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

for (const id of [
  "autoCoral",
  "autoAlgae",
  "leftZone",
  "teleCoral",
  "teleAlgae",
  "netScores",
  "endgame",
  "died",
]) {
  getField(id).addEventListener("input", recomputeSummary);
  getField(id).addEventListener("change", recomputeSummary);
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
recomputeSummary();
