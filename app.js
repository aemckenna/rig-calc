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
          ×
        </button>
      </td>
    `;