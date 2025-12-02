const STORAGE_KEY = "dmx_power_calc_rig";

let rig = [];
let universeGridContainer;
let gridUniverseInput;
let gridUniverseForm;
let gridUniverseHint;
let fixtureLegend;

document.addEventListener("DOMContentLoaded", () => {
  universeGridContainer = document.getElementById("universeGrid");
  gridUniverseInput = document.getElementById("gridUniverseInput");
  gridUniverseForm = document.getElementById("gridUniverseForm");
  gridUniverseHint = document.getElementById("gridUniverseHint");
  fixtureLegend = document.getElementById("fixtureLegend");

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

function getFixturesForUniverse(universe) {
  return rig.filter((item) => item.universe === universe);
}

function buildFixtureColorMap(fixtures) {
  const colorMap = new Map();

  fixtures.forEach((item, index) => {
    const hue = (index * 47) % 360;
    const color = `hsl(${hue}, 75%, 55%)`;
    colorMap.set(item.id, color);
  });

  return colorMap;
}

function renderFixtureLegend(universe, fixtures, colorMap) {
  if (!fixtureLegend) return;

  fixtureLegend.innerHTML = "";

  if (!universe || fixtures.length === 0) return;

  fixtures.forEach((item) => {
    const row = document.createElement("span");
    row.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = colorMap.get(item.id) || "rgba(255,255,255,0.15)";

    const label = document.createElement("span");
    label.textContent =
      `${item.fixtureName} (${item.modeName}) - ` +
      `U${item.universe} ${item.startAddress}-${item.endAddress}`;

    row.appendChild(swatch);
    row.appendChild(label);
    fixtureLegend.appendChild(row);
  });
}

function buildUniverseGridData(universe) {
  const cells = Array.from({ length: 512 }, () => []);

  if (!universe) return cells;

  rig.forEach((item) => {
    if (item.universe !== universe) return;

    const start = Math.max(1, Number(item.startAddress) || 1);
    const end = Math.min(512, Number(item.endAddress) || 512);

    for (let ch = start; ch <= end; ch++) {
      cells[ch - 1].push(item);
    }
  });

  return cells;
}

function renderUniverseGrid(universe) {
  if (!universeGridContainer) return;

  universeGridContainer.innerHTML = "";
  if (fixtureLegend) fixtureLegend.innerHTML = "";

  if (!universe) {
    const p = document.createElement("p");
    p.className = "muted universe-grid-summary";
    p.textContent =
      "Enter a valid universe number from your saved rig to display the channel grid.";
    universeGridContainer.appendChild(p);
    return;
  }

  const fixturesInUniverse = getFixturesForUniverse(universe);
  const colorMap = buildFixtureColorMap(fixturesInUniverse);
  renderFixtureLegend(universe, fixturesInUniverse, colorMap);

  const cells = buildUniverseGridData(universe);

  let usedCount = 0;
  let overlapCount = 0;

  const gridEl = document.createElement("div");
  gridEl.className = "universe-grid";

  for (let i = 0; i < 512; i++) {
    const chan = i + 1;
    const fixturesHere = cells[i];
    const cell = document.createElement("div");
    let className = "universe-grid-cell";

    if (fixturesHere.length === 0) {
      className += " universe-grid-cell--empty";
    } else if (fixturesHere.length === 1) {
      className += " universe-grid-cell--used";
      usedCount++;

      const line = fixturesHere[0];
      const lineColor = colorMap.get(line.id);
      if (lineColor) {
        cell.style.background = lineColor;
        cell.style.color = "#020305";
      }
    } else {
      className += " universe-grid-cell--overlap";
      usedCount++;
      overlapCount++;

      const line = fixturesHere[0];
      const lineColor = colorMap.get(line.id);
      if (lineColor) {
        cell.style.backgroundImage = `linear-gradient(
          135deg,
          ${lineColor},
          rgba(255,77,106,0.9)
        )`;
        cell.style.color = "#020305";
      }
    }

    cell.className = className;
    cell.dataset.channel = chan;
    cell.textContent = chan;

    if (fixturesHere.length > 0) {
      const lines = fixturesHere
        .map(
          (f) =>
            `${f.fixtureName} (${f.modeName}), qty ${f.qty}, addr ${f.startAddress}-${f.endAddress}`
        )
        .join("\n");
      cell.title = `Channel ${chan}\n${lines}`;
    } else {
      cell.title = `Channel ${chan} (empty)`;
    }

    gridEl.appendChild(cell);
  }

  const summary = document.createElement("p");
  summary.className = "muted universe-grid-summary";
  summary.textContent =
    `Universe ${universe}: ${usedCount} of 512 channels used` +
    (overlapCount > 0 ? ` - ${overlapCount} overlapping channels` : "");

  universeGridContainer.appendChild(gridEl);
  universeGridContainer.appendChild(summary);
}
