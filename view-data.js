const columns = window.ScoutingSync.columns;
const getField = (id) => document.getElementById(id);
const targetSpreadsheetUrl = window.ScoutingSync.targetSpreadsheetUrl;

function getEntries() {
  return window.ScoutingSync.getEntries();
}

function getWebhookUrl() {
  return window.ScoutingSync.getWebhookUrl();
}

function setStatus(text) {
  getField("sheetsStatus").textContent = text;
}

function saveWebhookUrl() {
  const input = getField("sheetsWebhookUrl");
  const url = input.value.trim();

  if (url.length === 0) {
    localStorage.removeItem(window.ScoutingSync.sheetsWebhookKey);
    setStatus("Apps Script URL cleared. CSV download is still available on this device.");
    return;
  }

  localStorage.setItem(window.ScoutingSync.sheetsWebhookKey, url);
  setStatus("Apps Script URL saved. Pending offline entries will sync to Floyd's spreadsheet when you are online.");
  window.ScoutingSync.flushPendingUploads()
    .then((result) => {
      if (result.uploaded > 0) {
        setStatus(`Apps Script URL saved. Uploaded ${result.uploaded} pending offline entries to Floyd's spreadsheet.`);
      }
    })
    .catch(() => {
      setStatus("Apps Script URL saved. Offline entries will upload automatically when you are online.");
    });
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
  getField("csvPreview").textContent = entries.length === 0 ? "No saved data yet." : window.ScoutingSync.toCsv(entries);
  getField("pendingCount").textContent = String(window.ScoutingSync.getPendingUploads().length);
}

function createCsvBlob(entries) {
  const csvText = window.ScoutingSync.toCsv(entries);
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
    alert("Please paste the Google Apps Script Web App URL for Floyd's spreadsheet and click Save URL first.");
    return;
  }

  const pending = window.ScoutingSync.getPendingUploads();
  if (pending.length === 0) {
    setStatus("No pending offline entries to upload right now.");
    return;
  }

  try {
    const result = await window.ScoutingSync.flushPendingUploads();
    setStatus(result.uploaded > 0 ? `Upload request sent for ${result.uploaded} pending entries.` : "No pending offline entries to upload right now.");
    renderData();
  } catch {
    setStatus("Upload failed. Verify your webhook URL and internet connection.");
    alert("Upload failed. Check your webhook URL and try again.");
  }
}

getField("sheetsWebhookUrl").value = getWebhookUrl();
getField("targetSpreadsheetLink").href = targetSpreadsheetUrl;
setStatus(
  getWebhookUrl()
    ? "Apps Script URL loaded. Pending offline entries will sync automatically to Floyd's spreadsheet when online."
    : "Direct syncing needs one Google Apps Script Web App URL for Floyd's spreadsheet. Until then, use Download CSV on each device."
);

getField("saveWebhookBtn").addEventListener("click", saveWebhookUrl);
getField("refreshBtn").addEventListener("click", renderData);
getField("downloadDataBtn").addEventListener("click", downloadCsv);
getField("sendToSheetsBtn").addEventListener("click", sendToGoogleSheets);

window.ScoutingSync.registerServiceWorker();
window.ScoutingSync.flushPendingUploads().finally(renderData);
