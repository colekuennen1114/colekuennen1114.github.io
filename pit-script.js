const PIT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYYXQp9w0miMoWi4oCunxJVo7LxOZdb6zDKsMvbuwnu_WQ6kCk4ihImGfuRigWKU4q/exec";

const pitTextFieldIds = [
  "pitEventName",
  "pitScoutName",
  "pitTeamNumber",
  "pitContact",
  "pitDimensions",
  "pitWeight",
  "pitDriveTrainOther",
  "pitShooterTypeOther",
  "pitCapacity",
  "pitBallsPerSecond",
  "pitClimbAbilityOther",
  "pitVisionHardwareOther",
  "pitLimelightVersion",
  "pitShootingAccuracy",
  "pitIntakeReliability",
  "pitAutoScoring",
  "pitAutoRoutes",
  "pitRoles",
  "pitFerryingOther",
  "pitReliability",
  "pitRepairReadiness",
  "pitDriverExperience",
  "pitDriverPracticeHours",
  "pitRobotNotes",
  "pitCooperativeOther",
  "pitAnsweredQuestions",
  "pitOtherNotes",
];

const pitRadioFieldNames = [
  "pitDriveTrain",
  "pitShooterType",
  "pitAprilTagVision",
  "pitVisionHardware",
  "pitAutoAimVision",
  "pitShootOnMove",
  "pitClimbAbility",
  "pitClimbLevel",
  "pitFerrying",
  "pitCooperative",
];

const getField = (id) => document.getElementById(id);
const getRadioValue = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || "";

function getPitSubmitCount() {
  return Number(sessionStorage.getItem("pit_submit_count") || "0");
}

function updatePitCount() {
  getField("pitEntryCount").textContent = String(getPitSubmitCount());
}

function collectPitEntry() {
  const entry = {};
  for (const id of pitTextFieldIds) {
    entry[id] = getField(id).value.trim();
  }

  entry.pitDriveTrain = getRadioValue("pitDriveTrain");
  entry.pitShooterType = getRadioValue("pitShooterType");
  entry.pitAprilTagVision = getRadioValue("pitAprilTagVision");
  entry.pitVisionHardware = getRadioValue("pitVisionHardware");
  entry.pitAutoAimVision = getRadioValue("pitAutoAimVision");
  entry.pitShootOnMove = getRadioValue("pitShootOnMove");
  entry.pitClimbAbility = getRadioValue("pitClimbAbility");
  entry.pitClimbLevel = getRadioValue("pitClimbLevel");
  entry.pitFerrying = getRadioValue("pitFerrying");
  entry.pitCooperative = getRadioValue("pitCooperative");
  entry.timestamp = new Date().toISOString();

  return entry;
}

function clearPitForm() {
  for (const id of pitTextFieldIds) {
    getField(id).value = "";
  }

  for (const name of pitRadioFieldNames) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = false;
    });
  }

  updateLimelightVersionVisibility();
}

function setSubmittingState(isSubmitting) {
  getField("savePitBtn").disabled = isSubmitting;
  getField("clearPitBtn").disabled = isSubmitting;
  getField("savePitBtn").textContent = isSubmitting ? "Submitting…" : "Submit Pit Entry";
}

async function submitPitEntry() {
  if (!PIT_APPS_SCRIPT_URL) {
    alert("Missing pit scouting Apps Script URL.");
    return;
  }

  setSubmittingState(true);

  try {
    const response = await fetch(PIT_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(collectPitEntry()),
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = { status: "error", message: responseText || "Submission failed." };
    }

    if (response.ok && result.status === "success") {
      const submitCount = getPitSubmitCount() + 1;
      sessionStorage.setItem("pit_submit_count", String(submitCount));
      updatePitCount();
      clearPitForm();
      window.ScoutingSync.showToast("Pit submission recorded.");
      return;
    }

    alert(result.message || result.error || "Unable to submit pit entry.");
  } catch (error) {
    alert(error instanceof Error ? error.message : "Unable to submit pit entry.");
  } finally {
    setSubmittingState(false);
  }
}

function updateLimelightVersionVisibility() {
  const isLimelight = getRadioValue("pitVisionHardware") === "Limelight";
  const limelightLabel = getField("pitLimelightVersionLabel");
  limelightLabel.hidden = !isLimelight;

  if (!isLimelight) {
    getField("pitLimelightVersion").value = "";
  }
}

document.querySelectorAll('input[name="pitVisionHardware"]').forEach((input) => {
  input.addEventListener("change", updateLimelightVersionVisibility);
});

getField("savePitBtn").addEventListener("click", submitPitEntry);
getField("clearPitBtn").addEventListener("click", clearPitForm);

const pitBackHomeLink = getField("pitBackHomeLink");
if (pitBackHomeLink) {
  pitBackHomeLink.addEventListener("click", (event) => {
    const confirmed = window.confirm("Leave pit scouting and go back home? Any unsaved changes will be lost.");
    if (!confirmed) {
      event.preventDefault();
    }
  });
}

window.ScoutingSync.registerServiceWorker();
updateLimelightVersionVisibility();
updatePitCount();
