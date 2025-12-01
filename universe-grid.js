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

  if (gridUniverseForm) {
    gridUniverseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const u = parseInt(gridUniverseInput.value, 10);
      if (!u || u <= 0) {
        renderUniverseGrid(null);
      } else {
        renderUniverseGrid(u);
      }
    });
  }
});

function loadRigFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.rig)) {
      rig = data.rig;
    }
  } catch (err) {
    console.warn("Unable to load rig from storage:", err);
  }
}
