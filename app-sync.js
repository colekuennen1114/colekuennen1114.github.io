const ScoutingSync = (() => {
  const entriesKey = "frc2026_scout_entries";
  const pendingUploadsKey = "frc2026_pending_uploads";
  const sheetsWebhookKey = "frc2026_sheets_webhook";
  const targetSpreadsheetUrl = "https://docs.google.com/spreadsheets/d/1M8QigTM__Esjc7xViWB5vVS9fHCC5_9p7fcxTM9tgRg/edit?usp=drivesdk";

  const columns = [
    "eventName", "scoutName", "teamNumber", "matchNumber", "alliance", "startPos",
    "autoShootDistance", "autoFuelScored", "autoFuelAccuracy", "autoFloorIntake",
    "autoTrench", "autoBump", "autoIntakeOutpost", "autoIntakeNeutralZone",
    "autoPassingNeutralZone", "autoFerryingNeutralZone", "autoDied", "autoClimb", "autoClimbOtherText",
    "teleStartPosition", "teleShootDistance", "teleFuelScored", "teleHumanPlayerFuelScored",
    "teleFuelAccuracy", "teleFloorIntake", "teleTrench", "teleBump", "teleIntakeOutpost",
    "teleIntakeNeutralZone", "telePassingNeutralZone", "teleFerryingNeutralZone", "teleDied", "teleClimb", "teleClimbOtherText",
    "defense", "driverSkill", "penaltyPoints", "violationName", "notes", "timestamp"
  ];

  const readJson = (key) => JSON.parse(localStorage.getItem(key) || "[]");
  const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  function getEntries() { return readJson(entriesKey); }
  function saveEntries(entries) { writeJson(entriesKey, entries); }
  function getPendingUploads() { return readJson(pendingUploadsKey); }
  function savePendingUploads(entries) { writeJson(pendingUploadsKey, entries); }
  function getWebhookUrl() { return (localStorage.getItem(sheetsWebhookKey) || "").trim(); }

  function queueEntry(entry) {
    const entries = getEntries();
    entries.push(entry);
    saveEntries(entries);

    const pending = getPendingUploads();
    pending.push(entry);
    savePendingUploads(pending);

    return entries.length;
  }

  function toCsv(entries) {
    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    };

    return [columns.join(","), ...entries.map((row) => columns.map((column) => escapeCsv(row[column])).join(","))].join("\n");
  }

  async function flushPendingUploads() {
    const pending = getPendingUploads();
    const webhookUrl = getWebhookUrl();

    if (!navigator.onLine || pending.length === 0 || !webhookUrl) {
      return { uploaded: 0, skipped: pending.length };
    }

    const payload = {
      source: "oec_rebuilt_scouting",
      timestamp: new Date().toISOString(),
      columns,
      rows: pending,
      csv: toCsv(pending),
    };

    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    savePendingUploads([]);
    return { uploaded: pending.length, skipped: 0 };
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove("visible"), 3000);
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }

  window.addEventListener("online", () => {
    flushPendingUploads()
      .then((result) => {
        if (result.uploaded > 0) {
          showToast(`Uploaded ${result.uploaded} offline entr${result.uploaded === 1 ? "y" : "ies"}.`);
        }
      })
      .catch(() => {});
  });

  return {
    columns,
    entriesKey,
    sheetsWebhookKey,
    targetSpreadsheetUrl,
    getEntries,
    saveEntries,
    getPendingUploads,
    getWebhookUrl,
    queueEntry,
    toCsv,
    flushPendingUploads,
    showToast,
    registerServiceWorker,
  };
})();

window.ScoutingSync = ScoutingSync;
