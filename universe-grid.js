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

function getUsedUniverses() {
  const set = new Set();
  rig.forEach((item) => {
    if (item.universe && item.universe > 0) {
      set.add(item.universe);
    }
  });
  return Array.from(set).sort((a, b) => a - b);
}

function updateHintWithUsedUniverses(universes) {
  if (!gridUniverseHint) return;

  if (!universes || universes.length === 0) {
    gridUniverseHint.textContent =
      "No saved rig found. Build and save a rig on the main calculator page to see DMX usage here.";
  } else {
    gridUniverseHint.textContent =
      "Universes in use: " +
      universes.join(", ") +
      ". You can enter any of these above.";
  }
}

function buildUniverseGridData(universe) {
  const cells = new Array(512).fill(null).map(() => []);

  if (!universe) return cells;

  rig.forEach((item) => {
    if (item.universe !== universe) return;
    const start = Math.max(1, item.startAddress);
    const end = Math.min(512, item.endAddress);

    for (let ch = start; ch <= end; ch++) {
      cells[ch - 1].push(item);
    }
  });

  return cells;
}

function renderUniverseGrid(universe) {
  if (!universeGridContainer) return;

  universeGridContainer.innerHTML = "";

  if (!universe) {
    const p = document.createElement("p");
    p.className = "muted universe-grid-summary";
    p.textContent =
      "Enter a valid universe number from your saved rig to display the channel grid.";
    universeGridContainer.appendChild(p);
    return;
  }