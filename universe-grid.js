const STORAGE_KEY = "dmx_power_calc_rig";

let rig = [];
let universeGridContainer;
let gridUniverseInput;
let gridUniverseForm;
let gridUniverseHint;

document.addEventListener("DOMContentLoaded", () => {
  universeGridContainer = document.getElementById("universeGrid");
  gridUniverseInput = document.getElementById("gridUniverseInput");
  gridUniverseForm = document.getElementById("gridUniverseForm");
  gridUniverseHint = document.getElementById("gridUniverseHint");

  loadRigFromStorage();

    const usedUniverses = getUsedUniverses();
  if (usedUniverses.length > 0) {
    const firstUniverse = usedUniverses[0];
    gridUniverseInput.value = String(firstUniverse);
    updateHintWithUsedUniverses(usedUniverses);
    renderUniverseGrid(firstUniverse);
  } else {
    updateHintWithUsedUniverses([]);
    renderUniverseGrid(null);
  }
