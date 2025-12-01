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
  const usage = {}; // { [universe]: totalChannels }

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

function renderAll() {
  renderRigTable();
  renderUniverseUsage();
}
