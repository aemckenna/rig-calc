import { FIXTURES } from "./fixtures.js";

const VOLTAGE = 120; // starting simple with assumed voltage for amp calculation

let rig = [];
let nextRigId = 1;

let fixtureTypeSelect;
let fixtureModeSelect;
let fixtureQtyInput;
let dmxUniverseInput;
let startAddressInput;
let circuitNameInput;
let fixtureForm;
let rigTableBody;
let emptyRigMessage;
let formMessage;
let loadDemoBtn;
let clearRigBtn;
let universeUsageContainer;
let powerSummaryContainer;

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  initFixtureSelects();
  renderAll();
  loadRigFromStorage();

  fixtureTypeSelect.addEventListener("change", handleFixtureTypeChange);
  fixtureForm.addEventListener("submit", handleAddFixture);
  loadDemoBtn.addEventListener("click", handleLoadDemoRig);
  clearRigBtn.addEventListener("click", handleClearRig);
});

function cacheDom() {
  fixtureTypeSelect = document.getElementById("fixtureType");
  fixtureModeSelect = document.getElementById("fixtureMode");
  fixtureQtyInput = document.getElementById("fixtureQty");
  dmxUniverseInput = document.getElementById("dmxUniverse");
  startAddressInput = document.getElementById("startAddress");
  circuitNameInput = document.getElementById("circuitName");
  fixtureForm = document.getElementById("fixtureForm");
  rigTableBody = document.querySelector("#rigTable tbody");
  emptyRigMessage = document.getElementById("emptyRigMessage");
  formMessage = document.getElementById("formMessage");
  loadDemoBtn = document.getElementById("loadDemoBtn");
  clearRigBtn = document.getElementById("clearRigBtn");
  universeUsageContainer = document.getElementById("universeUsage");
  powerSummaryContainer = document.getElementById("powerSummary");
}

function initFixtureSelects() {
  fixtureTypeSelect.innerHTML = "";
  FIXTURES.forEach((fx, index) => {
    const option = document.createElement("option");
    option.value = fx.id;
    option.textContent = `${fx.brand} – ${fx.name}`;
    if (index === 0) option.selected = true;
    fixtureTypeSelect.appendChild(option);
  });

  populateModeSelect(getSelectedFixture());
}

function getSelectedFixture() {
  const id = fixtureTypeSelect.value;
  return FIXTURES.find((fx) => fx.id === id) || FIXTURES[0];
}

function populateModeSelect(fixture) {
  fixtureModeSelect.innerHTML = "";
  fixture.modes.forEach((mode, index) => {
    const option = document.createElement("option");
    option.value = mode.name;
    option.textContent = `${mode.name} (${mode.channels} ch, ${mode.powerWatts} W)`;
    if (index === 0) option.selected = true;
    fixtureModeSelect.appendChild(option);
  });
}

function handleFixtureTypeChange() {
  const fixture = getSelectedFixture();
  populateModeSelect(fixture);
}

/* Forms */
function handleAddFixture(event) {
  event.preventDefault();
  clearFormMessage();

  const fixture = getSelectedFixture();
  const modeName = fixtureModeSelect.value.trim();
  const mode = fixture.modes.find((m) => m.name === modeName);

  if (!mode) {
    showFormMessage("Invalid mode selection.", true);
    return;
  }

  const qty = parseInt(fixtureQtyInput.value, 10) || 0;
  const universe = parseInt(dmxUniverseInput.value, 10) || 0;
  let start = parseInt(startAddressInput.value, 10) || 0;
  const circuit = circuitNameInput.value.trim();

  if (start <= 0 || start > 512) {
    showFormMessage("Start address must be between 1 and 512.", true);
    return;
  }

  const channelsPerFixture = mode.channels;
  const totalChannels = channelsPerFixture * qty;
  const endAddress = start + channelsPerFixture * qty - 1;

  if (endAddress > 512) {
    showFormMessage(
      `Channel footprint (ends at ${endAddress}) exceeds 512 in universe ${universe}. Adjust start, mode, or quantity.`,
      true
    );
    return;
  }
  const wattsPerFixture = mode.powerWatts;
  const totalWatts = wattsPerFixture * qty;

  const rigItem = {
    id: nextRigId++,
    fixtureId: fixture.id,
    fixtureName: `${fixture.brand} - ${fixture.name}`,
    modeName,
    qty,
    universe,
    startAddress: start,
    endAddress,
    channelsPerFixture,
    totalChannels,
    wattsPerFixture,
    totalWatts,
    circuitName: circuit || "Unassigned",
    voltage: fixture.defaultVoltage || VOLTAGE,
  };

  rig.push(rigItem);
  saveRigToStorage();
  renderAll();

  const nextAddress = getNextAddressForUniverse(universe);
  startAddressInput.value = nextAddress;
  showFormMessage("Fixture added to rig.", false);
}

function showFormMessage(message, isError) {
  formMessage.textContent = message;
  formMessage.classList.toggle("form-message--error", !!isError);
  formMessage.classList.toggle("form-message--success", !isError);
}

function clearFormMessage() {
  formMessage.textContent = "";
  formMessage.classList.remove("form-message--error", "form-message--success");
}

/* Rig Rendering */
function renderRigTable() {
  rigTableBody.innerHTML = "";

  if (rig.length === 0) {
    emptyRigMessage.style.display = "block";
    return;
  }
  emptyRigMessage.style.display = "none";

  rig.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(item.fixtureName)}</td>
      <td>${escapeHtml(item.modeName)}</td>
      <td>${item.qty}</td>
      <td>${item.universe}</td>
      <td>${item.startAddress}</td>
      <td>${item.endAddress}</td>
      <td>${item.totalChannels}</td>
      <td>${item.totalWatts}</td>
      <td>${escapeHtml(item.circuitName)}</td>
      <td>
        <button class="delete-row-btn" data-id="${item.id}" title="Remove line">
          x
        </button>
      </td>
    `;
    rigTableBody.appendChild(tr);
  });

  rigTableBody.querySelectorAll(".delete-row-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.getAttribute("data-id"), 10);
      deleteRigItem(id);
    });
  });
}

function deleteRigItem(id) {
  rig = rig.filter((item) => item.id !== id);
  saveRigToStorage();
  renderAll();
}

/* DMX Universe */
function calculateUniverseUsage() {
  const usage = {};

  rig.forEach((item) => {
    if (!usage[item.universe]) {
      usage[item.universe] = 0;
    }
    usage[item.universe] += item.totalChannels;
  });

  return usage;
}

function renderUniverseUsage() {
  universeUsageContainer.innerHTML = "";

  const usage = calculateUniverseUsage();
  const universes = Object.keys(usage).sort((a, b) => Number(a) - Number(b));

  if (universes.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "No universes in use yet. Add fixtures to see DMX usage.";
    universeUsageContainer.appendChild(p);
    return;
  }

  universes.forEach((universe) => {
    const used = usage[universe];
    const percent = Math.min((used / 512) * 100, 100);
    const over = used > 512;

    const row = document.createElement("div");
    row.className = "universe-row";

    const label = document.createElement("div");
    label.className = "universe-label";
    label.innerHTML = `
      <span>Universe ${universe}</span>
      <span>${used} / 512 channels</span>
    `;

    const bar = document.createElement("div");
    bar.className = "universe-bar";

    const fill = document.createElement("div");
    fill.className = "universe-bar-fill";
    if (over) fill.classList.add("universe-bar-fill--over");
    fill.style.width = `${percent}%`;

    bar.appendChild(fill);
    row.appendChild(label);
    row.appendChild(bar);

    if (over) {
      const warn = document.createElement("p");
      warn.className = "universe-warning";
      warn.textContent =
        "Over 512 channels in this universe. Reduce load or split fixtures.";
      row.appendChild(warn);
    }

    universeUsageContainer.appendChild(row);
  });
}

/* Power */

function calculatePowerByCircuit() {
  const circuits = {};

  rig.forEach((item) => {
    const key = item.circuitName || "Unassigned";
    if (!circuits[key]) {
      circuits[key] = { watts: 0 };
    }
    circuits[key].watts += item.totalWatts;
  });

  // Convert to amps
  Object.keys(circuits).forEach((name) => {
    const watts = circuits[name].watts;
    circuits[name].amps = watts / VOLTAGE;
  });

  return circuits;
}

function renderPowerSummary() {
  powerSummaryContainer.innerHTML = "";

  const circuits = calculatePowerByCircuit();
  const names = Object.keys(circuits).sort((a, b) => a.localeCompare(b));

  if (names.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = "Assign circuits when adding fixtures to see load.";
    powerSummaryContainer.appendChild(p);
    return;
  }

  names.forEach((name) => {
    const { watts, amps } = circuits[name];
    const roundedAmps = Math.round(amps * 10) / 10;

    let badgeClass = "power-badge--ok";
    let badgeText = "Within 15A";
    if (amps > 20) {
      badgeClass = "power-badge--over";
      badgeText = "Over 20A";
    } else if (amps > 15) {
      badgeClass = "power-badge--warn";
      badgeText = "15A-20A";
    }

    const card = document.createElement("article");
    card.className = "power-card";

    card.innerHTML = `
      <div class="power-card-header">
        <div class="power-card-circuit">${escapeHtml(name)}</div>
        <div class="power-card-amps">${roundedAmps.toFixed(1)} A</div>
      </div>
      <div class="power-card-body">
        <div>${watts} W @ ${VOLTAGE} V</div>
        <div class="power-badge ${badgeClass}">${badgeText}</div>
      </div>
    `;

    powerSummaryContainer.appendChild(card);
  });
}

/* Storage */

const STORAGE_KEY = "dmx_power_calc_rig";

function saveRigToStorage() {
  try {
    const payload = {
      rig,
      nextRigId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Unable to save rig to localStorage:", err);
  }
}

function loadRigFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.rig)) {
      rig = data.rig;
      nextRigId =
        typeof data.nextRigId === "number" ? data.nextRigId : rig.length + 1;
    }
  } catch (err) {
    console.warn("Unable to load rig from localStorage:", err);
  }
}

function getNextAddressForUniverse(universe) {
  let maxEnd = 0;
  rig.forEach((item) => {
    if (item.universe === universe && item.endAddress > maxEnd) {
      maxEnd = item.endAddress;
    }
  });

  const candidate = maxEnd + 1;
  if (candidate > 512 || candidate <= 0) {
    return 1;
  }
  return candidate;
}

function handleLoadDemoRig() {
  rig = [
    {
      id: nextRigId++,
      fixtureId: "chauvet_r2_spot",
      fixtureName: "Chauvet - R2 Spot",
      modeName: "Extended",
      qty: 8,
      universe: 1,
      startAddress: 1,
      endAddress: 1 + 8 * 21 - 1,
      channelsPerFixture: 21,
      totalChannels: 8 * 21,
      wattsPerFixture: 240,
      totalWatts: 8 * 240,
      circuitName: "SL Spots",
      voltage: VOLTAGE,
    },
    {
      id: nextRigId++,
      fixtureId: "chauvet_r3_wash",
      fixtureName: "Chauvet - R3 Wash",
      modeName: "Detailed",
      qty: 4,
      universe: 1,
      startAddress: 169,
      endAddress: 169 + 4 * 62 - 1,
      channelsPerFixture: 62,
      totalChannels: 4 * 62,
      wattsPerFixture: 660,
      totalWatts: 4 * 660,
      circuitName: "SR Washes",
      voltage: VOLTAGE,
    },
    {
      id: nextRigId++,
      fixtureId: "astera_hyperion_tube",
      fixtureName: "Astera - Hyperion Tube",
      modeName: "DIM RGBAW DIM RGBAW",
      qty: 8,
      universe: 2,
      startAddress: 1,
      endAddress: 1 + 8 * 48 - 1,
      channelsPerFixture: 48,
      totalChannels: 8 * 48,
      wattsPerFixture: 92,
      totalWatts: 8 * 92,
      circuitName: "Upstage Tubes",
      voltage: VOLTAGE,
    },
    {
      id: nextRigId++,
      fixtureId: "chauvet_r2x_beam",
      fixtureName: "Chauvet - R2X Beam",
      modeName: "Expanded",
      qty: 6,
      universe: 2,
      startAddress: 385,
      endAddress: 385 + 6 * 18 - 1,
      channelsPerFixture: 18,
      totalChannels: 6 * 18,
      wattsPerFixture: 413,
      totalWatts: 6 * 413,
      circuitName: "Downstage Beams",
      voltage: VOLTAGE,
    },
    {
      id: nextRigId++,
      fixtureId: "elation_sixpar_200",
      fixtureName: "Elation - Sixpar 200",
      modeName: "12-ch RGBW",
      universe: 3,
      startAddress: 1,
      endAddress: 1 + 8 * 12 - 1,
      channelsPerFixture: 12,
      totalChannels: 8 * 12,
      wattsPerFixture: 150,
      totalWatts: 8 * 150,
      circuitName: "Floor PARs",
      voltage: VOLTAGE,
    },
  ];

  saveRigToStorage();
  renderAll();
  clearFormMessage();
  showFormMessage("Demo rig loaded.", false);

  dmxUniverseInput.value = 3;
  startAddressInput.value = getNextAddressForUniverse(3);
}

function handleClearRig() {
  if (!confirm("Clear all fixtures from the rig?")) return;
  rig = [];
  nextRigId = 1;
  saveRigToStorage();
  renderAll();
  clearFormMessage();
}

function renderAll() {
  renderRigTable();
  renderUniverseUsage();
  renderPowerSummary();
}
