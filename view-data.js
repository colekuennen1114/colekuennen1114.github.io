const entriesKey = "frc2026_scout_entries";

const columns = [
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
  "timestamp",
];

const getField = (id) => document.getElementById(id);

function getEntries() {
  return JSON.parse(localStorage.getItem(entriesKey) || "[]");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(entries) {
  const lines = [columns.join(",")];
  for (const row of entries) {
    lines.push(columns.map((column) => escapeCsv(row[column])).join(","));
  }
  return lines.join("\n");
}

function renderTable(entries) {
  const table = getField("dataTable");

  if (entries.length === 0) {
    table.innerHTML = "<tr><td>No saved entries yet.</td></tr>";
    return;
  }

  const headCells = columns.map((column) => `<th>${column}</th>`).join("");
  const bodyRows = entries
    .map((entry) => {
      const cells = columns.map((column) => `<td>${String(entry[column] ?? "")}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  table.innerHTML = `<thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody>`;
}

function renderData() {
  const entries = getEntries();
  getField("dataCount").textContent = String(entries.length);
  renderTable(entries);
  getField("csvPreview").textContent = entries.length === 0 ? "No saved data yet." : toCsv(entries);
}

function createCsvBlob(entries) {
  const csvText = toCsv(entries);
  return new Blob([csvText], { type: "text/csv;charset=utf-8;" });
}

function triggerDownload(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "frc2026_scouting_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsv() {
  const entries = getEntries();
  if (entries.length === 0) {
    alert("No entries saved yet.");
    return;
  }

  triggerDownload(createCsvBlob(entries));
}

async function sendToGoogleSheets() {
  const entries = getEntries();
  if (entries.length === 0) {
    alert("No entries saved yet.");
    return;
  }

  const blob = createCsvBlob(entries);
  const file = new File([blob], "frc2026_scouting_data.csv", { type: "text/csv" });

  const canNativeShare = navigator.share && navigator.canShare && navigator.canShare({ files: [file] });

  if (canNativeShare) {
    try {
      await navigator.share({
        files: [file],
        title: "FRC 2026 Scouting Data",
        text: "Scouting CSV export",
      });
      return;
    } catch {
      // fall through to fallback flow
    }
  }

  triggerDownload(blob);
  window.open("https://docs.google.com/spreadsheets/create", "_blank", "noopener,noreferrer");
  alert("CSV downloaded. In Google Sheets, use File > Import > Upload to send this CSV into a sheet.");
}

getField("refreshBtn").addEventListener("click", renderData);
getField("downloadDataBtn").addEventListener("click", downloadCsv);
getField("sendToSheetsBtn").addEventListener("click", sendToGoogleSheets);

renderData();
