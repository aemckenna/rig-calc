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
