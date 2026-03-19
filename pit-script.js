const pitEntriesKey = "frc2026_pit_entries";

const pitFieldIds = [
  "pitEventName",
  "pitScoutName",
  "pitTeamNumber",
  "pitContact",
  "pitDimensions",
  "pitWeight",
  "pitDriveTrainOther",
  "pitShooterTypeOther",
  "pitCapacity",
  "pitCycleSpeed",
  "pitHopperEmptyTime",
  "pitBallsPerSecond",
  "pitAprilTagVision",
  "pitVisionHardware",
  "pitVisionHardwareOther",
  "pitLimelightVersion",
  "pitAutoAimVision",
  "pitShootOnMove",
  "pitShootingAccuracy",
  "pitIntakeReliability",
  "pitClimbOrientation",
  "pitClimbConsistency",
  "pitAutoScoring",
  "pitAutoRoutes",
  "pitRoles",
  "pitFerrying",
  "pitReliability",
  "pitRepairReadiness",
  "pitDriverExperience",
  "pitDriverPracticeHours",
  "pitRobotNotes",
  "pitCooperativeOther",
  "pitAnsweredQuestions",
  "pitOtherNotes",
];

const pitColumns = [
  "pitEventName",
  "pitScoutName",
  "pitTeamNumber",
  "pitContact",
  "pitDimensions",
  "pitWeight",
  "pitDriveTrain",
  "pitDriveTrainOther",
  "pitShooterType",
  "pitShooterTypeOther",
  "pitCapacity",
  "pitCycleSpeed",
  "pitHopperEmptyTime",
  "pitBallsPerSecond",
  "pitAprilTagVision",
  "pitVisionHardware",
  "pitVisionHardwareOther",
  "pitLimelightVersion",
  "pitAutoAimVision",
  "pitShootOnMove",
  "pitShootingAccuracy",
  "pitIntakeReliability",
  "pitClimbOrientation",
  "pitClimbLevel",
  "pitClimbConsistency",
  "pitAutoScoring",
  "pitAutoRoutes",
  "pitRoles",
  "pitFerrying",
  "pitReliability",
  "pitRepairReadiness",
  "pitDriverExperience",
  "pitDriverPracticeHours",
  "pitRobotNotes",
  "pitCooperative",
  "pitCooperativeOther",
  "pitAnsweredQuestions",
  "pitOtherNotes",
  "timestamp",
];

const getField = (id) => document.getElementById(id);
const getRadioValue = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || "";

function getPitEntries() {
  return JSON.parse(localStorage.getItem(pitEntriesKey) || "[]");
}

function savePitEntries(entries) {
  localStorage.setItem(pitEntriesKey, JSON.stringify(entries));
}

function updatePitCount() {
  getField("pitEntryCount").textContent = String(getPitEntries().length);
}

function collectPitEntry() {
  const entry = {};
  for (const id of pitFieldIds) {
    entry[id] = getField(id).value.trim();
  }

  entry.pitDriveTrain = getRadioValue("pitDriveTrain");
  entry.pitShooterType = getRadioValue("pitShooterType");
  entry.pitAprilTagVision = getRadioValue("pitAprilTagVision");
  entry.pitVisionHardware = getRadioValue("pitVisionHardware");
  entry.pitAutoAimVision = getRadioValue("pitAutoAimVision");
  entry.pitShootOnMove = getRadioValue("pitShootOnMove");
  entry.pitClimbLevel = getRadioValue("pitClimbLevel");
  entry.pitCooperative = getRadioValue("pitCooperative");
  entry.timestamp = new Date().toISOString();

  return entry;
}

function clearPitForm() {
  for (const id of pitFieldIds) {
    getField(id).value = "";
  }

  for (const name of [
    "pitDriveTrain",
    "pitShooterType",
    "pitAprilTagVision",
    "pitVisionHardware",
    "pitAutoAimVision",
    "pitShootOnMove",
    "pitClimbLevel",
    "pitCooperative",
  ]) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = false;
    });
  }

  updateLimelightVersionVisibility();
}

function savePitEntry() {
  const entries = getPitEntries();
  entries.push(collectPitEntry());
  savePitEntries(entries);
  updatePitCount();
  clearPitForm();
  window.ScoutingSync.showToast("Pit entry saved.");
}


function updateLimelightVersionVisibility() {
  const isLimelight = getRadioValue("pitVisionHardware") === "Limelight";
  const limelightLabel = getField("pitLimelightVersionLabel");
  limelightLabel.hidden = !isLimelight;

  if (!isLimelight) {
    getField("pitLimelightVersion").value = "";
  }
}

function clearPitEntries() {
  localStorage.removeItem(pitEntriesKey);
  updatePitCount();
  window.ScoutingSync.showToast("Pit entries cleared.");
}

function downloadPitCsv() {
  const entries = getPitEntries();
  if (entries.length === 0) {
    alert("No pit entries saved yet.");
    return;
  }

  const escapeCsv = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const csvText = [
    pitColumns.join(","),
    ...entries.map((entry) => pitColumns.map((column) => escapeCsv(entry[column])).join(",")),
  ].join("\n");

  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "frc2026_pit_scouting_data.csv";
  link.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll('input[name="pitVisionHardware"]').forEach((input) => {
  input.addEventListener("change", updateLimelightVersionVisibility);
});

getField("savePitBtn").addEventListener("click", savePitEntry);
getField("downloadPitBtn").addEventListener("click", downloadPitCsv);
getField("clearPitBtn").addEventListener("click", clearPitEntries);

window.ScoutingSync.registerServiceWorker();
updateLimelightVersionVisibility();
updatePitCount();
