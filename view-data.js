const entriesKey = "frc2026_scout_entries";
const sheetsWebhookKey = "frc2026_sheets_webhook";

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

function getWebhookUrl() {
  return (localStorage.getItem(sheetsWebhookKey) || "").trim();
}

function setStatus(text) {
  getField("sheetsStatus").textContent = text;
}

function saveWebhookUrl() {
  const input = getField("sheetsWebhookUrl");
  const url = input.value.trim();

  if (url.length === 0) {
    localStorage.removeItem(sheetsWebhookKey);
    setStatus("Webhook URL cleared. Upload button is disabled until you set it again.");
    return;
  }

  localStorage.setItem(sheetsWebhookKey, url);
  setStatus("Webhook URL saved. You can now upload in one click.");
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

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    alert("Please paste your Google Apps Script Web App URL and click Save URL first.");
    return;
  }

  const payload = {
    source: "frc2026_scouting_template_2",
    timestamp: new Date().toISOString(),
    columns,
    rows: entries,
    csv: toCsv(entries),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setStatus("Upload request sent to Google Sheets webhook.");
  } catch {
    setStatus("Upload failed. Verify your webhook URL and internet connection.");
    alert("Upload failed. Check your webhook URL and try again.");
  }
}

getField("sheetsWebhookUrl").value = getWebhookUrl();
setStatus(getWebhookUrl() ? "Webhook URL loaded. Ready for one-click upload." : "Set your Apps Script URL once, then upload with one click.");

getField("saveWebhookBtn").addEventListener("click", saveWebhookUrl);
getField("refreshBtn").addEventListener("click", renderData);
getField("downloadDataBtn").addEventListener("click", downloadCsv);
getField("sendToSheetsBtn").addEventListener("click", sendToGoogleSheets);

renderData();
